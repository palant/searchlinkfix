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

    window.gBrowser.addTabsProgressListener(progressListener);
    window.gBrowser.addEventListener("testhelper_middleclick", fakeMiddleClick, false, true);
    window.gBrowser.addEventListener("testhelper_closeBackgroundTabs", closeBackgroundTabs, false, true);
  },

  removeFromWindow: function(window)
  {
    if (!("gBrowser" in window))
      return;

    window.gBrowser.removeTabsProgressListener(progressListener);
    window.gBrowser.removeEventListener("testhelper_middleclick", fakeMiddleClick, false, true);
    window.gBrowser.removeEventListener("testhelper_closeBackgroundTabs", closeBackgroundTabs, false, true);
  }
});

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
