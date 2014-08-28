Google search link fix
=============================

Google search link fix is a Firefox extension that prevents Google, Yahoo and Yandex search pages from modifying search result links when you click them. This is useful when copying links but it also helps privacy by preventing the search engines from recording your clicks. [Detailed description](https://palant.de/2011/11/28/google-yandex-search-link-fix)

Prerequisites
-------------
* [Python 2.7](https://www.python.org/downloads/)
* [Jinja2 module for Python](http://jinja.pocoo.org/docs/intro/#installation)
* Adblock Plus build tools (clone https://github.com/adblockplus/buildtools.git into the `buildtools` subdirectory)

How to build
------------

Run the following command:

    python build.py build

This will create a development build with the file name like `searchlinkfix-1.2.3.nnnn.xpi`. In order to create a release build use the following command:

    python build.py build --release

How to test
-----------

Testing your changes is easiest if you install the [Extension Auto-Installer extension](https://addons.mozilla.org/addon/autoinstaller/). Then you can push the current repository state to your browser using the following command:

    python build.py autoinstall 8888

Google search link fix will be updated automatically, without any prompts or browser restarts.

Integration tests
-----------------

Running the integration tests requires [Selenium Python bindings](http://selenium-python.readthedocs.org/en/latest/installation.html) to be installed. You can run the integration tests with the following command:

    python run_tests.py

This will instrument Firefox to test Google search link fix on various websites, all Python files from the `tests` directory will be executed. These files run in a minimal environment, the following functionality is available:

* `driver` variable is a [`WebDriver` instance](http://selenium.googlecode.com/svn/trunk/docs/api/py/webdriver_remote/selenium.webdriver.remote.webdriver.html).
* `wait_until(method)` will wait until the method returns `True` or time out after 10 seconds.
* `accept_alert()` accepts an alert box displayed by the webpage.
* `chain(method, ...)` will call all methods passed in with an [`ActionChains` instance](http://selenium.googlecode.com/svn/trunk/docs/api/py/webdriver/selenium.webdriver.common.action_chains.html) as parameter.
* `get_urls()` will return the list of URLs the browser navigated to (including redirects) since the previous call.
* `middle_click(element)` sends the necessary mouse events to an element to simulate a middle-click.
* `close_background_tabs()` closes all but the currently selected tab in the current browser window.
* `Keys` variable was imported from the [selenium.webdriver.common.keys](http://selenium.googlecode.com/svn/trunk/docs/api/py/webdriver/selenium.webdriver.common.keys.html) module.
* `re` points to Python's `re` module.
* `print()` is the standard Python [`print()` function](https://docs.python.org/2/library/functions.html#print) and can be used for debugging.

Note that Selenium WebDriver lacks some functionality which is why the testhelper extension is added to the Firefox profile in addition to Google search link fix. This extension is required for `get_urls()`, `middle_click()` and `close_background_tabs()` functions to work.
