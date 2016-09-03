/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

window.addEventListener("mousedown", saveLinkTarget, true);
window.addEventListener("mousedown", restoreLinkTarget, false);
window.addEventListener("click", interceptEvent, true);
window.addEventListener("keydown", interceptEvent, true);

function detach()
{
  try
  {
    self.port.off("detach", detach);

    window.removeEventListener("mousedown", saveLinkTarget, true);
    window.removeEventListener("mousedown", restoreLinkTarget, false);
    window.removeEventListener("click", interceptEvent, true);
    window.removeEventListener("keydown", interceptEvent, true);
  }
  catch(e)
  {
    // Ignore, likely "permission denied" because window has been unloaded
  }
}

self.port.on("detach", detach);

let currentLink = null;
let currentLinkHref = null;

let hosts = {
  "groups.google.com": "google-groups",
  "yandex.com": "yandex",
  "yandex.com.tr": "yandex",
  "yandex.by": "yandex",
  "yandex.kz": "yandex",
  "yandex.ru": "yandex",
  "yandex.ua": "yandex",
  "duckduckgo.com": "duckduckgo"
};

let containerAttr = {
  "google": ["id", "search"],
  "google-groups": ["role", "main"],
  "duckduckgo": ["class", "results"],
  "google-news": ["class", "content-pane-container"],
};

function isSearchPage(window)
{
  try
  {
    let host = window.location.host;
    if (hosts.hasOwnProperty(host))
      return hosts[host];

    host = host.replace(/^.*?\./, "");
    if (hosts.hasOwnProperty(host))
      return hosts[host];
  }
  catch (e) {}

  if (document.querySelector("meta[name='apple-itunes-app'][content='app-id=913753848']"))
    return "google-news";

  try
  {
    let g = unsafeWindow.google;
    if (g && (g.sn || g.search))
      return "google";
  }
  catch (e) {}

  if (document.readyState == "complete")
    detach();
  return null;
}

function isSearchResult(link)
{
  let type = isSearchPage(link.ownerDocument.defaultView);
  if (type === null)
    return false;

  if (containerAttr.hasOwnProperty(type))
  {
    let [attr, value] = containerAttr[type];
    for (let parent = link; parent; parent = parent.parentNode)
      if ("getAttribute" in parent && parent.getAttribute(attr) == value)
        return true;
  }
  return false;
}

function saveLinkTarget(event)
{
  if (!isSearchPage(event.target.ownerDocument.defaultView))
    return;

  for (currentLink = event.target; currentLink; currentLink = currentLink.parentNode)
    if (currentLink.localName == "a")
      break;

  currentLinkHref = (currentLink ? currentLink.href : null);

  // Just in case event propagation is canceled
  setTimeout(restoreLinkTarget, 0);
}

function restoreLinkTarget(event)
{
  try
  {
    if (currentLink && currentLink.href != currentLinkHref)
      currentLink.href = currentLinkHref;
  }
  catch (e)
  {
    // Ignore, likely "can't access dead object" (currentLink has been garbage collected)
  }

  currentLink = currentLinkHref = null;
}

function interceptEvent(event)
{
  if (event.type == "keydown" && event.keyCode != event.DOM_VK_RETURN)
    return;

  let link = null;
  for (link = event.target; link; link = link.parentNode)
    if (link.localName == "a" || link.localName == "img")
      break;

  if (link && link.localName == "a" && isSearchResult(link) &&
      /^\s*https?:/i.test(link.getAttribute("href")))
  {
    event.stopPropagation();
  }
}
