results = None
result = None

def init_results():
  global results, result
  results = driver.find_elements_by_css_selector("#links .result__a")
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

# Search for site:palant.de
driver.get("https://duckduckgo.com/?q=site%3Apalant.de")

# Choose a search result
driver.wait_until(init_results)
href = result.get_attribute("href")
assert "duckduckgo.com" not in href

# Right-click the search result
driver.chain(lambda c: c.context_click(result))
assert_link_unchanged()
driver.chain(lambda c: c.send_keys(driver.keys.ESCAPE))
assert_link_unchanged()

# Click the search result
assert_no_intermediate_urls(lambda: result.click(), href)
driver.back()
driver.wait_until(init_results)
assert_link_unchanged()

# Middle-click search result
assert_no_intermediate_urls(lambda: result.middle_click(), href)
driver.close_background_tabs()
assert_link_unchanged()

# Click region button to bring up dropdown
driver.find_element_by_class_name("region-switch__flag").click()
driver.wait_until(lambda: driver.find_element_by_class_name("popover__box--region"))
