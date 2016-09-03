Google search link fix
=============================

Google search link fix is a Firefox extension that prevents Google and Yandex search pages from modifying search result links when you click them. This is useful when copying links but it also helps privacy by preventing the search engines from recording your clicks. [Detailed description](https://palant.de/2011/11/28/google-yandex-search-link-fix)

How to build
------------

You need [jpm](https://developer.mozilla.org/en-US/Add-ons/SDK/Tools/jpm) to build Google search link fix. Run the following command:

    jpm xpi

This will create a package with the file name like `jid0-XWJxt5VvCXkKzQK99PhZqAn7Xbg@jetpack-n.n.n.xpi` that you can install in Firefox.

How to test
-----------

Testing your changes is easiest if you install the [Extension Auto-Installer extension](https://addons.mozilla.org/addon/autoinstaller/). Then you can push the current repository state to your browser using the following command:

    jpm post --post-url http://localhost:8888/

This will install Google search link fix in your browser automatically, without any prompts or browser restarts. You can also ask jpm to reinstall the extension whenever changes in the current directory are detected:

    jpm watchpost --post-url http://localhost:8888/

Integration tests
-----------------

Running the integration tests requires [Marionette Python Client](http://marionette-client.readthedocs.io/en/latest/basics.html#getting-the-client) to be installed. You can run the integration tests with the following command:

    python run_tests.py

This will instrument Firefox to test Google search link fix on various websites, all Python files from the `tests` directory will be executed. For these files the `run()` function will be executed with the [Marionette instance](http://marionette-client.readthedocs.io/en/latest/reference.html#marionette) as the only parameter. In addition to the official API, the following methods and properties are available:

* `driver.wait_for_load()` will wait until the current page is fully loaded (note that `Marionette.navigate()` will merely wait until the `DOMContentLoaded` event).
* `driver.wait_until(method)` will wait until the method returns `True` or time out after 10 seconds.
* `driver.accept_alert()` accepts an alert box displayed by the webpage.
* `driver.restore_url()` is to be called in the `with` statement and will navigate to previous URL once the `with` statement is exited.
* `driver.get_urls()` will return the list of URLs the browser navigated to (including redirects) since the previous call.
* `driver.close_windows(keep)` closes all windows but the one indicated as parameter.
* `driver.close_background_tabs()` closes all but the currently selected tab in the current browser window.
* `driver.keys` contains the key constants from `marionette_driver.keys`.
* `driver.expected` contains the [built-it wait conditions](http://marionette-client.readthedocs.io/en/latest/reference.html#module-marionette_driver.expected).

The [`HTMLElement` API](http://marionette-client.readthedocs.io/en/latest/reference.html#htmlelement) has been extended as well:

* `element.click()` emulates a left mouse button click on the element.
* `element.middle_click()` emulates a middle mouse button click on the element.
* `element.context_click()` emulates a right mouse button click on the element.

Note that Marionette lacks a way to track navigated URLs which is why the testhelper extension is added to the Firefox profile in addition to Google search link fix. This extension is required for `driver.get_urls()` functionality.
