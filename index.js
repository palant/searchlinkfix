/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

let {data} = require("sdk/self");
let {PageMod} = require("sdk/page-mod");

PageMod({
  include: "*",
  contentScriptFile: data.url("content.js"),
  contentScriptWhen: "start",
  attachTo: ["existing", "top", "frame"]
});
