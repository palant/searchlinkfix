def strip_anchor(url):
  import re
  return re.sub(r"#.*", "", url)

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

# Type in a search query
driver.get("https://images.google.com/?hl=en")
driver.wait_until(lambda: driver.find_element_by_name("q"))
driver.find_element_by_name("q").send_keys("site:palant.de", driver.keys.RETURN)
driver.wait_until(lambda: driver.find_element_by_id("ires"))

# Clicking a result image should show the preview on the same page (custom click behavior)
orig_url = strip_anchor(driver.current_url)
result = driver.find_element_by_id("ires").find_element_by_css_selector("a > img").click()
driver.wait_until(lambda: driver.find_element_by_id("irc_bg"))
assert orig_url == strip_anchor(driver.current_url)

results = driver.find_elements_by_css_selector("a.irc_but[href]")
results = filter(lambda element: element.is_displayed(), results)
for result in results:
  href = result.get_attribute("href")
  assert "google.com" not in href

  # Right-click the link
  driver.chain(lambda c: c.context_click(result))
  assert_link_unchanged()
  driver.chain(lambda c: c.send_keys(driver.keys.ESCAPE))
  assert_link_unchanged()

  # Middle-click search result
  assert_no_intermediate_urls(lambda: result.middle_click(), href)
  driver.close_background_tabs()
  assert_link_unchanged()

  # Click the link
  driver.execute_script("arguments[0].setAttribute('target', '_blank');", result)    # cheating
  orig_window = driver.current_window_handle
  assert_no_intermediate_urls(lambda: result.click(), href)
  close_windows(keep=orig_window)
  assert_link_unchanged()

# Click Apps button to bring up dropdown
driver.find_element_by_css_selector("a[title='Google apps']").click()
driver.wait_until(lambda: driver.find_element_by_css_selector("div[aria-label='Google apps']").is_displayed())
