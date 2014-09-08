results = None
result = None

def init_results():
  global results, result
  results = driver.find_elements_by_css_selector("#main [id^='link-']")
  if results:
    result = results[1]
    return True
  else:
    return False

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

def close_windows(keep):
  for h in [h for h in driver.window_handles if h != keep]:
    driver.switch_to.window(h)
    driver.close()
  driver.switch_to.window(keep)

# Search for site:palant.de
driver.get("https://search.yahoo.com/search?p=site%3Apalant.de")

# Choose a search result
driver.wait_until(init_results)
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
close_windows(keep=orig_window)
assert_link_unchanged()

# Middle-click search result
assert_no_intermediate_urls(lambda: result.middle_click(), href)
driver.close_background_tabs()
assert_link_unchanged()

# Click settings button to bring up dropdown
driver.find_element_by_id("yucs-help_button").click()
driver.wait_until(lambda: driver.find_element_by_id("yuhead-help-panel").is_displayed())
