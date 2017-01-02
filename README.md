Google search link fix
=============================

Google search link fix is a Firefox, Chrome and Opera extension that prevents Google and Yandex search pages from modifying search result links when you click them. This is useful when copying links but it also helps privacy by preventing the search engines from recording your clicks. [Detailed description](https://palant.de/2011/11/28/google-yandex-search-link-fix)

Installing build prerequisites
------------------------------

In order to build Google search link fix you will need to install [Node.js](https://nodejs.org/) first (Node 6 or higher is required). You will also need [Gulp](http://gulpjs.com/), run the following command to install it (administrator privileges required):

    npm install --global gulp-cli

Additional dependencies are installed using the following command in the extension directory:

    npm install

How to build
------------

If all the dependencies are installed, creating a Firefox build is simply a matter of running Gulp:

    gulp xpi

This will produce a file named like `searchlinkfix-n.n.n.xpi`. Creating a build for Chrome and Opera is similar but requires a private key that the build should be signed with:

    gulp crx --private-key=key.pem

This will create a signed Chrome packaged named like `searchlinkfix-n.n.n.crx`. If you omit the private key parameter you will get an unsigned ZIP package instead.

How to test
-----------

In order to test your changes you can load the repository to your browser as an unpacked extension directly. Then you will only have to reload in order for the changes to apply.

Integration tests
-----------------

Running the integration tests requires [Python 2.7](https://www.python.org/downloads/) and [Marionette Python Client](http://marionette-client.readthedocs.io/en/latest/basics.html#getting-the-client) to be installed. You can run the integration tests with the following command:

    gulp test --firefox-path=/usr/bin/firefox

You should change `/usr/bin/firefox` into the actual Firefox path on your system. This will instrument Firefox to test Google search link fix on various websites, all Python files from the `tests` directory will be executed. For these files the `run()` function will be executed with the [Marionette instance](http://marionette-client.readthedocs.io/en/latest/reference.html#marionette) as the only parameter. In addition to the official API, the following methods and properties are available:

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
