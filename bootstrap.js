/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

function install(params, reason) {}
function uninstall(params, reason) {}

function startup(params, reason)
{
  WindowObserver.init();
}

function shutdown(params, reason)
{
  WindowObserver.shutdown();
}

var WindowObserver =
{
  initialized: false,

  init: function()
  {
    if (this.initialized)
      return;
    this.initialized = true;

    let e = Services.ww.getWindowEnumerator();
    while (e.hasMoreElements())
      this.applyToWindow(e.getNext().QueryInterface(Ci.nsIDOMWindow));

    Services.ww.registerNotification(this);
  },

  shutdown: function()
  {
    if (!this.initialized)
      return;
    this.initialized = false;

    let e = Services.ww.getWindowEnumerator();
    while (e.hasMoreElements())
      this.removeFromWindow(e.getNext().QueryInterface(Ci.nsIDOMWindow));

    Services.ww.unregisterNotification(this);
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
  },

  observe: function(subject, topic, data)
  {
    if (topic == "domwindowopened")
    {
      let window = subject.QueryInterface(Ci.nsIDOMWindow);
      window.addEventListener("DOMContentLoaded", function()
      {
        if (this.initialized)
          this.applyToWindow(window);
      }.bind(this), false);
    }
  },

  QueryInterface: XPCOMUtils.generateQI([Ci.nsISupportsWeakReference, Ci.nsIObserver])
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
