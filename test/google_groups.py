result = None
href = None


def init_results(driver):
    global result
    try:
        result = driver.find_element('partial link text', 'mini-profiler')
    except:
        # Element not found
        pass
    return result


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

    # Open Groups post
    driver.navigate('https://groups.google.com/forum/?hl=en' +
                    '#!msg/play-framework/ZfmjuYnZrzg/2hx2zgq_GugJ')
    driver.wait_until(lambda: init_results(driver))

    # Check link URL
    href = result.get_attribute('href')
    assert 'google.com' not in href

    # Right-click the link
    result.context_click()
    assert_link_unchanged()
    result.send_keys(driver.keys.ESCAPE)
    assert_link_unchanged()

    # Click the link
    orig_window = driver.current_chrome_window_handle
    assert_no_intermediate_urls(driver, lambda: result.click(), href)
    driver.close_windows(keep=orig_window)
    assert_link_unchanged()

    # Middle-click search result
    assert_no_intermediate_urls(driver, lambda: result.middle_click(), href)
    driver.close_background_tabs()
    assert_link_unchanged()

    # Click Apps button to bring up dropdown
    driver.find_element('css selector', 'a[title="Google apps"]').click()
    driver.wait_until(lambda: driver.find_element('css selector', 'div[aria-label="Google apps"]').is_displayed())
