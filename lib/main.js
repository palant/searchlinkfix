/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

// Frame script URL has to be randomized due to caching
// (see https://bugzilla.mozilla.org/show_bug.cgi?id=1051238)
let frameScript = require("info").addonRoot + "lib/content.js?" + Math.random();

let messageManager = Cc["@mozilla.org/globalmessagemanager;1"]
                       .getService(Ci.nsIMessageBroadcaster);
messageManager.loadFrameScript(frameScript, false);
messageManager.loadFrameScript(frameScript, true);
onShutdown.add(function()
{
  messageManager.removeDelayedFrameScript(frameScript);
  if (messageManager instanceof Ci.nsIMessageBroadcaster)
    messageManager.broadcastAsyncMessage("searchlinkfix@palant.de:shutdown", frameScript);
});
