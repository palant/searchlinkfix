/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

let addonData = null;

function install(params, reason) {}
function uninstall(params, reason) {}

function startup(params, reason)
{
  addonData = params;
  require("appIntegration").AppIntegration.init();
}

function shutdown(params, reason)
{
  require("appIntegration").AppIntegration.shutdown();
  addonData = null;
  require.scopes = {__proto__: null};
}

function require(module)
{
  let scopes = require.scopes;
  if (!(module in scopes))
  {
    scopes[module] = {require: require, exports: {}};
    Services.scriptloader.loadSubScript(addonData.resourceURI.spec + module + ".js", scopes[module]);
  }
  return scopes[module].exports;
}
require.scopes = {__proto__: null};
