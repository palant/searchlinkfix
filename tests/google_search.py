results = None
result = None
href = None


def init_results(driver):
    global results, result
    driver.wait_for_load()
    results = driver.find_elements('css selector', '#search .r > a')
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

    # Search for site:palant.de
    driver.navigate('https://www.google.com/?gfe_rd=cr&hl=en')
    driver.wait_until(lambda: driver.find_elements('name', 'q'))
    driver.find_element('name', 'q').send_keys('site:palant.de', driver.keys.RETURN)

    # Choose a search result
    driver.wait_until(lambda: init_results(driver))
    href = result.get_attribute('href')
    assert 'google.com' not in href

    # Right-click the search result
    result.context_click()
    assert_link_unchanged()
    result.send_keys(driver.keys.ESCAPE)
    assert_link_unchanged()

    # Click the search result
    with driver.restore_url():
        assert_no_intermediate_urls(driver, lambda: result.click(), href)
    driver.wait_until(lambda: init_results(driver))
    assert_link_unchanged()

    # Press Enter on a search result
    with driver.restore_url():
        assert_no_intermediate_urls(driver,
                                    lambda: result.send_keys(driver.keys.RETURN),
                                    href)
    driver.wait_until(lambda: init_results(driver))
    assert_link_unchanged()

    # Middle-click search result
    assert_no_intermediate_urls(driver, lambda: result.middle_click(), href)
    driver.close_background_tabs()
    assert_link_unchanged()
