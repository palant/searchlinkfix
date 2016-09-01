#!/usr/bin/env python
# coding: utf-8

import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile

from selenium.webdriver.firefox.webdriver import WebDriver
from selenium.webdriver.firefox.firefox_profile import FirefoxProfile
from selenium.webdriver.firefox.firefox_binary import FirefoxBinary
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.alert import Alert

default_timeout = 10

def jpm_build(dir, output):
  # Ugly hack: JPM doesn't allow specifying output file name, so we have to
  # look for new files. See https://github.com/mozilla-jetpack/jpm/issues/315
  orig_files = set(os.listdir(dir))
  subprocess.check_call(["jpm", "xpi"], cwd=dir)
  new_files = set(os.listdir(dir))
  xpi = os.path.join(dir, (new_files - orig_files).pop())
  os.rename(xpi, output)

def run_tests(firefox_path=None):
  basedir = os.path.dirname(__file__)
  driver = None
  profile = FirefoxProfile()
  profile.set_preference('browser.tabs.remote.autostart', False)
  profile.set_preference('browser.tabs.remote.autostart.1', False)
  profile.set_preference('browser.tabs.remote.autostart.2', False)
  if firefox_path:
    if sys.platform == "darwin" and os.path.isdir(firefox_path):
      firefox_path = os.path.join(firefox_path, "Contents", "MacOS", "firefox")
    binary = FirefoxBinary(firefox_path)
  else:
    binary = None

  try:
    build1 = tempfile.NamedTemporaryFile(mode="wb", suffix=".xpi", delete=False)
    build2 = tempfile.NamedTemporaryFile(mode="wb", suffix=".xpi", delete=False)
    try:
      jpm_build(basedir, build1.name)
      jpm_build(os.path.join(basedir, "testhelper"), build2.name)
      profile.add_extension(build1.name)
      profile.add_extension(build2.name)
    finally:
      os.unlink(build1.name)
      os.unlink(build2.name)

    driver = WebDriver(profile, firefox_binary=binary)
    driver.wait_until = lambda method: WebDriverWait(driver, default_timeout).until(lambda d: method())
    driver.accept_alert = Alert(driver).accept
    driver.keys = Keys

    def chain(*actions):
      for action in actions:
        c = ActionChains(driver)
        action(c)
        c.perform()
    driver.chain = chain

    max_timestamp = {"value": 0}
    def get_urls():
      result = []
      prefix = "[testhelper] Loading: "
      new_timestamp = max_timestamp["value"]
      for item in driver.get_log("browser"):
        timestamp = item["timestamp"]
        if timestamp <= max_timestamp["value"] or not item["message"].startswith(prefix):
          continue
        if timestamp > new_timestamp:
          new_timestamp = timestamp
        result.append(item["message"][len(prefix):])
      max_timestamp["value"] = new_timestamp
      return result
    driver.get_urls = get_urls

    def close_background_tabs():
      driver.execute_script('''
        var event = document.createEvent("Events");
        event.initEvent("testhelper_closeBackgroundTabs", true, false);
        document.dispatchEvent(event);
      ''')
    driver.close_background_tabs = close_background_tabs

    def middle_click(self):
      driver.execute_script('''
        var event = document.createEvent("Events");
        event.initEvent("testhelper_middleclick", true, false);
        arguments[0].dispatchEvent(event);
      ''', self)
    WebElement.middle_click = middle_click

    environment = {
      "__builtins__": __builtins__,
      "driver": driver,
    }

    testdir = os.path.join(basedir, "tests")
    for filename in os.listdir(testdir):
      if filename.startswith(".") or not filename.endswith(".py"):
        continue
      filepath = os.path.join(testdir, filename)
      environment["__file__"] = filepath
      with open(filepath, "rb") as handle:
        exec handle in environment
  finally:
    if driver:
      driver.quit()
    shutil.rmtree(profile.path, ignore_errors=True)

if __name__ == "__main__":
  parser = argparse.ArgumentParser(description="Run unit tests")
  parser.add_argument("--app", metavar="FIREFOX_PATH", type=unicode, help="Path to the Firefox application")
  args = parser.parse_args()
  run_tests(args.app)
