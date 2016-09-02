results = None
result = None
href = None


def init_results(driver):
    global results, result
    results = driver.find_elements_by_css_selector('#cse a.gs-title')
    if results:
        result = results[1]
        return True
    else:
        return False


def assert_link_unchanged():
    global result, href
    assert result.get_attribute('href') == href


def assert_no_intermediate_urls(driver, method, target):
    driver.get_urls()
    method()
    urls = []

    def check_urls():
        urls.extend(driver.get_urls())
        return urls
    driver.wait_until(check_urls)
    assert urls[0] == target


def run(driver):
    global href

    # Search for test
    url = 'https://www.google.com/cse?cx=001104437084080304350%3An8odfuv0gvi'
    driver.get(url + '&q=test')

    # Choose a search result
    driver.wait_until(lambda: init_results(driver))
    href = result.get_attribute('href')
    assert 'google.com' not in href

    # Right-click the search result
    driver.chain(lambda c: c.context_click(result))
    assert_link_unchanged()
    driver.chain(lambda c: c.send_keys(driver.keys.ESCAPE))
    assert_link_unchanged()

    # Click the search result
    assert_no_intermediate_urls(driver, lambda: result.click(), href)
    driver.back()
    driver.wait_until(lambda: init_results(driver))
    assert_link_unchanged()

    # Middle-click search result
    assert_no_intermediate_urls(driver, lambda: result.middle_click(), href)
    driver.close_background_tabs()
    assert_link_unchanged()
