result = None
href = None


def strip_anchor(url):
    import re
    return re.sub(r'#.*', '', url)


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
    global result, href

    # Type in a search query
    driver.navigate('https://images.google.com/?hl=en')
    driver.wait_until(lambda: driver.find_element('name', 'q'))
    driver.find_element('name', 'q').send_keys('site:palant.de', driver.keys.RETURN)
    driver.wait_until(lambda: driver.find_elements('id', 'ires'))

    # Clicking a result image should show the preview on the same page (custom click behavior)
    orig_url = strip_anchor(driver.get_url())
    result = driver.find_element('id', 'ires').find_element('css selector', 'a > img').click()
    driver.wait_until(lambda: driver.find_elements('id', 'irc_bg'))
    assert orig_url == strip_anchor(driver.get_url())

    results = driver.find_elements('css selector', 'a.irc_but[href]')
    results = filter(lambda element: element.is_displayed(), results)
    for result in results:
        href = result.get_attribute('href')
        assert 'google.com' not in href

        # Right-click the link
        result.context_click()
        assert_link_unchanged()
        result.send_keys(driver.keys.ESCAPE)
        assert_link_unchanged()

        # Middle-click search result
        assert_no_intermediate_urls(driver, lambda: result.middle_click(), href)
        driver.close_background_tabs()
        assert_link_unchanged()

        # Click the link
        driver.execute_script('arguments[0].setAttribute("target", "_blank");', result)    # cheating
        orig_window = driver.current_chrome_window_handle
        assert_no_intermediate_urls(driver, lambda: result.click(), href)
        driver.close_windows(keep=orig_window)
        assert_link_unchanged()

    # Click Apps button to bring up dropdown
    driver.find_element('css selector', 'a[title="Google apps"]').click()
    driver.wait_until(lambda: driver.find_element('css selector', 'div[aria-label="Google apps"]').is_displayed())
