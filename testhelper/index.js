/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

let {Ci, Cu} = require("chrome");
let events = require("sdk/system/events");
let utils = require("sdk/window/utils");

function checkWindow(window)
{
  console.error("Got window: " + window.location.href)
  let loadCallback = function()
  {
    console.error("Window loaded: " + window.location.href)
    window.removeEventListener("load", loadCallback);

    if (utils.isBrowser(window))
    {
      console.error("Browser: " + window.location.href)
      window.gBrowser.addTabsProgressListener(progressListener);
      window.gBrowser.addEventListener("testhelper_middleclick", fakeMiddleClick, false, true);
      window.gBrowser.addEventListener("testhelper_closeBackgroundTabs", closeBackgroundTabs, false, true);
    }
  };

  if (window.document.readyState == "complete")
    loadCallback();
  else
    window.addEventListener("load", loadCallback);
}

let progressListener =
{
  onStateChange: function(browser, webProgress, request, flags, status)
  {
    if (!(flags & Ci.nsIWebProgressListener.STATE_IS_WINDOW))
      return;
    if (!(flags & Ci.nsIWebProgressListener.STATE_START) && !(flags & Ci.nsIWebProgressListener.STATE_REDIRECTING))
      return;
    if (request instanceof Ci.nsIChannel)
      Cu.reportError("[testhelper] Loading: " + request.URI.spec);
  }
};

function fakeMiddleClick(event)
{
  let utils = event.target.ownerDocument.defaultView
                   .QueryInterface(Ci.nsIInterfaceRequestor)
                   .getInterface(Ci.nsIDOMWindowUtils);
  let rect = event.target.getBoundingClientRect();
  utils.sendMouseEvent("mousedown", rect.left + 1, rect.top + 1, 1, 1, 0);
  utils.sendMouseEvent("mouseup", rect.left + 1, rect.top + 1, 1, 1, 0);
}

function closeBackgroundTabs(event)
{
  let browser = event.currentTarget;
  for (let i = browser.tabs.length - 1; i >= 0; i--)
    if (browser.tabs[i] != browser.selectedTab)
      browser.removeTab(browser.tabs[i]);
}

events.on("chrome-document-global-created", event => checkWindow(event.subject), true);
utils.windows("navigator:browser").forEach(checkWindow);
