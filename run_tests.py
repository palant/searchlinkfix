#!/usr/bin/env python
# coding: utf-8

import argparse
import os
import subprocess
import sys
import tempfile

from marionette_driver.marionette import Marionette, Actions, HTMLElement
from marionette_driver.addons import Addons
from marionette_driver import expected
from marionette_driver.keys import Keys
from marionette_driver.wait import Wait

default_timeout = 10


def gulp_build(dir, output):
    subprocess.check_call(['gulp', 'xpi', '--outfile=' + output], cwd=dir)


def jpm_build(basedir, dir, output):
    # Ugly hack: JPM doesn't allow specifying output file name, so we have to
    # look for new files. See https://github.com/mozilla-jetpack/jpm/issues/315
    orig_files = set(os.listdir(dir))
    jpm_path = os.path.join(basedir, 'node_modules', '.bin', 'jpm')
    if sys.platform == 'win32':
        jpm_path += '.exe'
    subprocess.check_call([os.path.abspath(jpm_path), 'xpi'], cwd=dir)
    new_files = set(os.listdir(dir))
    xpi = os.path.join(dir, (new_files - orig_files).pop())
    os.rename(xpi, output)


def run_tests(firefox_path=None):
    basedir = os.path.dirname(__file__)

    if sys.platform == 'darwin' and os.path.isdir(firefox_path):
        firefox_path = os.path.join(firefox_path,
                                    'Contents', 'MacOS', 'firefox')

    driver = Marionette(app='fxdesktop', bin=firefox_path, gecko_log='-',
                        prefs={'xpinstall.signatures.required': False})
    driver.start_session()

    try:
        build1 = tempfile.NamedTemporaryFile(mode='wb', suffix='.xpi',
                                             delete=False)
        build2 = tempfile.NamedTemporaryFile(mode='wb', suffix='.xpi',
                                             delete=False)
        try:
            gulp_build(basedir, build1.name)
            jpm_build(basedir, os.path.join(basedir, 'testhelper'), build2.name)

            addons = Addons(driver)
            addons.install(build1.name, temp=True)
            addons.install(build2.name, temp=True)
        finally:
            os.unlink(build1.name)
            os.unlink(build2.name)

        driver.expected = expected
        driver.keys = Keys

        class restore_url:
            def __enter__(self):
                self.url = driver.get_url()

            def __exit__(self, type, value, traceback):
                driver.navigate('about:blank')
                driver.navigate(self.url)
        driver.restore_url = restore_url

        def wait_until(method):
            Wait(driver, default_timeout).until(lambda d: method())
        driver.wait_until = wait_until

        def accept_alert():
            driver.switch_to_alert().accept()
        driver.accept_alert = accept_alert

        max_timestamp = {'value': 0}

        def get_urls():
            result = []
            prefix = '[testhelper] Loading: '
            new_timestamp = max_timestamp['value']
            with driver.using_context(driver.CONTEXT_CHROME):
                messages = driver.execute_script(
                    'return ' +
                    'Cc["@mozilla.org/consoleservice;1"]' +
                    '.getService(Ci.nsIConsoleService).getMessageArray()' +
                    '.map(m => m instanceof Ci.nsIScriptError ? ' +
                    '[m.timeStamp, m.errorMessage] : [null, null])'
                )
            for timestamp, message in messages:
                if timestamp <= max_timestamp['value']:
                    continue
                if not message.startswith(prefix):
                    continue
                if timestamp > new_timestamp:
                    new_timestamp = timestamp
                result.append(message[len(prefix):])
            max_timestamp['value'] = new_timestamp
            return result
        driver.get_urls = get_urls

        def close_windows(keep):
            for h in [h for h in driver.chrome_window_handles if h != keep]:
                driver.switch_to_window(h)
                driver.close_chrome_window()
            driver.switch_to_window(keep)
        driver.close_windows = close_windows

        def close_background_tabs():
            current_tab = driver.current_window_handle
            for h in [h for h in driver.window_handles if h != current_tab]:
                driver.switch_to_window(h)
                driver.close()
            driver.switch_to_window(current_tab)
        driver.close_background_tabs = close_background_tabs

        def wait_for_load():
            code = 'return document.readyState == "complete";'
            driver.wait_until(lambda: driver.execute_script(code))
        driver.wait_for_load = wait_for_load

        def click(self):
            action = Actions(driver)
            action.click(self)
            action.perform()
        HTMLElement.click = click

        def middle_click(self):
            action = Actions(driver)
            action.middle_click(self)
            action.perform()
        HTMLElement.middle_click = middle_click

        def context_click(self):
            action = Actions(driver)
            action.context_click(self)
            action.perform()
        HTMLElement.context_click = context_click

        testdir = os.path.join(basedir, 'tests')
        for filename in os.listdir(testdir):
            if filename.startswith('.') or not filename.endswith('.py'):
                continue
            filepath = os.path.join(testdir, filename)
            globals = {}
            execfile(filepath, globals)
            globals['run'](driver)
    finally:
        driver.cleanup()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run unit tests')
    parser.add_argument('app', metavar='firefox-path', type=unicode,
                        help='Path to the Firefox application')
    args = parser.parse_args()
    run_tests(args.app)
