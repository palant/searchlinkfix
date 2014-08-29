results = None
result = None

def init_results():
  global results, result
  results = driver.find_element_by_id("ires").find_elements_by_css_selector(".r > a")
  result = results[1]

def assert_link_unchanged():
  global result, href
  assert result.get_attribute("href") == href

def assert_no_intermediate_urls(method, target):
  get_urls()
  method()
  urls = []
  def check_urls():
    urls.extend(get_urls())
    return urls
  wait_until(check_urls)
  assert urls[0] == target

# Make sure to use google.com
driver.get("https://www.google.de/?hl=en")
driver.find_element_by_link_text("Use Google.com").click()
wait_until(lambda: driver.current_url.startswith("https://www.google.com/"))

# Type in a search query
wait_until(lambda: driver.find_element_by_name("q"))
driver.find_element_by_name("q").send_keys("site:palant.de", Keys.RETURN)
wait_until(lambda: driver.find_element_by_id("ires"))

# Choose a search result
init_results()
href = result.get_attribute("href")
assert "google.com" not in href

# Right-click the search result
chain(lambda c: c.context_click(result))
assert_link_unchanged()
chain(lambda c: c.send_keys(Keys.ESCAPE))
assert_link_unchanged()

# Click the search result
assert_no_intermediate_urls(lambda: result.click(), href)
driver.back()
wait_until(lambda: driver.find_element_by_id("ires"))
init_results()
assert_link_unchanged()

# Keyboard navigation
driver.execute_script("document.getElementsByName('q')[0].focus()")
chain(
  lambda c: c.send_keys(Keys.TAB, Keys.TAB, Keys.DOWN),
)
assert driver.switch_to.active_element == result

# Press Enter on a search result
assert_no_intermediate_urls(lambda: chain(
  lambda c: c.key_down(Keys.RETURN).send_keys(Keys.RETURN).key_up(Keys.RETURN),
), href)
driver.back()
wait_until(lambda: driver.find_element_by_id("ires"))
init_results()
assert_link_unchanged()

# Middle-click search result
assert_no_intermediate_urls(lambda: middle_click(result), href)
close_background_tabs()
assert_link_unchanged()

# Click Apps button to bring up dropdown
driver.find_element_by_css_selector("a[title='Apps']").click()
wait_until(lambda: driver.find_element_by_css_selector("div[aria-label='Apps']"))

# Switch off Instant results
driver.find_element_by_id("abar_button_opt").click()
driver.find_element_by_css_selector("#ab_options [role='menuitem'] a").click()
wait_until(lambda: driver.find_element_by_id("instant-radio"))
driver.find_element_by_css_selector("#instant-radio > :last-child").click()
driver.find_element_by_css_selector("#form-buttons > :first-child").click()
accept_alert()
wait_until(lambda: driver.find_element_by_id("ires"))
init_results()
assert_link_unchanged()

# Click the search result again
assert_no_intermediate_urls(lambda: result.click(), href)
driver.back()
wait_until(lambda: driver.find_element_by_id("ires"))
init_results()
assert_link_unchanged()
