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
  },

  removeFromWindow: function(window)
  {
    if (!("gBrowser" in window))
      return;

    window.gBrowser.removeEventListener("mousedown", saveLinkTarget, true);
    window.gBrowser.removeEventListener("mousedown", restoreLinkTarget, false);
  }
});

let currentLink = null;
let currentLinkHref = null;

function isSearchPage(window)
{
  try
  {
    if (window.location.host == "yandex.ru")
      return true;
  }
  catch (e) {}

  let sandbox = new Cu.Sandbox(window);
  sandbox.window = XPCNativeWrapper.unwrap(window);
  try
  {
    return Cu.evalInSandbox("window.google && (window.google.sn || window.google.search) ? true : false", sandbox);
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
  if (currentLink && currentLink.href != currentLinkHref)
    currentLink.href = currentLinkHref;

  currentLink = currentLinkHref = null;
}
