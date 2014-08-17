/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

let {WindowObserver} = require("windowObserver");
new WindowObserver({
  applyToWindow: function(window)
  {
    if (!("gBrowser" in window))
      return;

    window.gBrowser.addEventListener("mousedown", saveLinkTarget, true);
    window.gBrowser.addEventListener("mousedown", restoreLinkTarget, false);
    window.gBrowser.addEventListener("click", restoreLinkTarget, false);
    window.gBrowser.addEventListener("keydown", interceptReturn, true);
  },

  removeFromWindow: function(window)
  {
    if (!("gBrowser" in window))
      return;

    window.gBrowser.removeEventListener("mousedown", saveLinkTarget, true);
    window.gBrowser.removeEventListener("mousedown", restoreLinkTarget, false);
    window.gBrowser.removeEventListener("click", restoreLinkTarget, false);
    window.gBrowser.removeEventListener("keydown", interceptReturn, true);
  }
});

let currentLink = null;
let currentLinkHref = null;

let hostSet = new Set([
  "groups.google.com",
  "search.yahoo.com",
  "yandex.com",
  "yandex.com.tr",
  "yandex.by",
  "yandex.kz",
  "yandex.ru",
  "yandex.ua"
]);

function isSearchPage(window)
{
  try
  {
    let host = window.location.host;
    if (hostSet.has(host) || hostSet.has(host.replace(/^.*?\./, "")))
      return true;
  }
  catch (e) {}

  let sandbox = new Cu.Sandbox(window);
  sandbox.window = window;
  try
  {
    return Cu.evalInSandbox("(function(){var g = window.wrappedJSObject.google; return g && (g.sn || g.search) ? true : false;})()", sandbox);
  }
  catch (e)
  {
    return false;
  }
}

function saveLinkTarget(event)
{
  if (!isSearchPage(event.target.ownerDocument.defaultView))
    return;

  for (currentLink = event.target; currentLink; currentLink = currentLink.parentNode)
    if (currentLink.localName == "a")
      break;

  currentLinkHref = (currentLink ? currentLink.href : null);
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

  if (event.type == "click")
    currentLink = currentLinkHref = null;
}

function interceptReturn(event)
{
  let target = event.target;
  if (event.keyCode == Ci.nsIDOMKeyEvent.DOM_VK_RETURN &&
      target.localName == "a" &&
      /^\s*https?:/i.test(target.getAttribute("href")) &&
      isSearchPage(target.ownerDocument.defaultView))
  {
    event.stopPropagation();
  }
}
