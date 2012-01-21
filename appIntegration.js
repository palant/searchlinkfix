/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

let {WindowObserver} = require("windowObserver");

let AppIntegration = exports.AppIntegration =
{
  initialized: false,

  init: function()
  {
    if (this.initialized)
      return;
    this.initialized = true;

    WindowObserver.init(this);
  },

  shutdown: function()
  {
    if (!this.initialized)
      return;
    this.initialized = false;

    WindowObserver.shutdown(this);
  },

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
};

let include = /^https?:\/\/(www\.|encrypted\.)?google((\.com?)?\.\w{2}|\.com)\/.*/;
let currentLink = null;
let currentLinkHref = null;

function saveLinkTarget(event)
{
  if (!include.test(event.target.ownerDocument.defaultView.location.href))
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
