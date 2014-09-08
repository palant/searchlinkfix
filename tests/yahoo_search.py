results = None
result = None

def init_results():
  global results, result
  results = driver.find_element_by_id("main").find_elements_by_css_selector("[id^='link-']")
  result = results[1]

def assert_link_unchanged():
  global result, href
  assert result.get_attribute("href") == href

def assert_no_intermediate_urls(method, target):
  driver.get_urls()
  method()
  urls = []
  def check_urls():
    urls.extend(driver.get_urls())
    return urls
  driver.wait_until(check_urls)
  assert urls[0] == target

def close_windows(leave_open):
  for h in [h for h in driver.window_handles if h != leave_open]:
    driver.switch_to.window(h)
    driver.close()
  driver.switch_to.window(leave_open)

# Search for site:palant.de
driver.get("https://search.yahoo.com/search?p=site%3Apalant.de")
driver.wait_until(lambda: driver.find_element_by_id("main"))

# Choose a search result
init_results()
href = result.get_attribute("href")
assert "yahoo.com" not in href

# Right-click the search result
driver.chain(lambda c: c.context_click(result))
assert_link_unchanged()
driver.chain(lambda c: c.send_keys(driver.keys.ESCAPE))
assert_link_unchanged()

# Click the search result
orig_window = driver.current_window_handle
assert_no_intermediate_urls(lambda: result.click(), href)
close_windows(orig_window)
init_results()
assert_link_unchanged()

# Middle-click search result
assert_no_intermediate_urls(lambda: result.middle_click(), href)
driver.close_background_tabs()
assert_link_unchanged()

# Click settings button to bring up dropdown
driver.find_element_by_id("yucs-help_button").click()
driver.wait_until(lambda: driver.find_element_by_id("yuhead-help-panel").is_displayed())
