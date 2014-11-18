/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

// Prior to Firefox 29 the scope will be shared with other frame scripts
// (see https://bugzilla.mozilla.org/show_bug.cgi?id=673569)
(function()
{
  let Ci = Components.interfaces;
  let Cu = Components.utils;

  addEventListener("mousedown", saveLinkTarget, true);
  addEventListener("mousedown", restoreLinkTarget, false);
  // For some reason regular addEventListener() doesn't work for clicks in
  // Gecko 33 (seems to be fixed in Gecko 36).
  docShell.chromeEventHandler.addEventListener("click", interceptEvent, true);
  addEventListener("keydown", interceptEvent, true);

  addMessageListener("searchlinkfix@palant.de:shutdown", function(message)
  {
    if (message.data == Components.stack.filename)
    {
      removeEventListener("mousedown", saveLinkTarget, true);
      removeEventListener("mousedown", restoreLinkTarget, false);
      docShell.chromeEventHandler.removeEventListener("click", interceptEvent, true);
      removeEventListener("keydown", interceptEvent, true);
    }
  });

  let currentLink = null;
  let currentLinkHref = null;

  let hosts = {
    "groups.google.com": "google-groups",
    "search.yahoo.com": "yahoo",
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
    "yahoo": ["id", "results"],
    "duckduckgo": ["class", "results"],
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

    let sandbox = new Cu.Sandbox(window);
    sandbox.window = window;
    try
    {
      if (Cu.evalInSandbox("(function(){var g = window.wrappedJSObject.google; return g && (g.sn || g.search) ? true : false;})()", sandbox))
        return "google";
    }
    catch (e) {}

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
    if (event.type == "keydown" && event.keyCode != Ci.nsIDOMKeyEvent.DOM_VK_RETURN)
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
})();
