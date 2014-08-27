#!/usr/bin/env python
# coding: utf-8

from __future__ import print_function

import os
import shutil
import tempfile
from buildtools.packagerGecko import createBuild
from selenium.webdriver.firefox.webdriver import WebDriver
from selenium.webdriver.firefox.firefox_profile import FirefoxProfile
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.alert import Alert

default_timeout = 10

def run_tests():
  basedir = os.path.dirname(__file__)
  driver = None
  profile = FirefoxProfile()
  try:
    build1 = tempfile.NamedTemporaryFile(mode="wb", suffix=".xpi", delete=False)
    build2 = tempfile.NamedTemporaryFile(mode="wb", suffix=".xpi", delete=False)
    try:
      createBuild(basedir, type="gecko", outFile=build1)
      createBuild(os.path.join(basedir, "testhelper"), type="gecko", outFile=build2)
      profile.add_extension(build1.name)
      profile.add_extension(build2.name)
    finally:
      os.unlink(build1.name)
      os.unlink(build2.name)
    driver = WebDriver(profile)

    def chain(*actions):
      for action in actions:
        c = ActionChains(driver)
        action(c)
        c.perform()

    max_timestamp = {"value": 0}
    def get_urls():
      result = []
      prefix = "Loading: "
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

    environment = {
      "__builtins__": {},
      "driver": driver,
      "wait_until": WebDriverWait(driver, default_timeout).until,
      "accept_alert": Alert(driver).accept,
      "chain": chain,
      "get_urls": get_urls,
      "print": print,
      "Keys": Keys,
      "True": True,
      "False": False,
      "Exception": Exception,
      "AssertionError": AssertionError,
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
  run_tests()
