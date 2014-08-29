def strip_anchor(url):
  import re
  return re.sub(r"#.*", "", url)

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
