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

    window.gBrowser.addProgressListener(progressListener);
  },

  removeFromWindow: function(window)
  {
    if (!("gBrowser" in window))
      return;

    window.gBrowser.removeProgressListener(progressListener);
  }
});

let progressListener =
{
  onLocationChange: function(webProgress, request, location, flags) {},
  onProgressChange: function() {},
  onSecurityChange: function() {},
  onStateChange: function(webProgress, request, flags, status)
  {
    if (!(flags & Ci.nsIWebProgressListener.STATE_IS_WINDOW))
      return;
    if (!(flags & Ci.nsIWebProgressListener.STATE_START) && !(flags & Ci.nsIWebProgressListener.STATE_REDIRECTING))
      return;
    if (request instanceof Ci.nsIChannel)
      Cu.reportError("Loading: " + request.URI.spec);
  },
  onStatusChange: function() {}
};
