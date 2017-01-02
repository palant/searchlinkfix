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
  let loadCallback = function()
  {
    window.removeEventListener("load", loadCallback);

    if (utils.isBrowser(window))
      window.gBrowser.addTabsProgressListener(progressListener);
  };

  if (window.document.readyState == "complete")
    loadCallback();
  else
    window.addEventListener("load", loadCallback);
}

let progressListener = {
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

events.on("chrome-document-global-created", event => checkWindow(event.subject), true);
utils.windows("navigator:browser").forEach(checkWindow);
