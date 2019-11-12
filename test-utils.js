/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

"use strict";

const puppeteer = require("puppeteer");
const puppeteerApi = require("puppeteer/lib/api");

puppeteerApi.ElementHandle.prototype.getHref = function()
{
  return this.evaluate(e => e.href);
};

exports.launchBrowser = async function()
{
  return await puppeteer.launch({
    args: [
      "--load-extension=crx-unpacked/",
      "--no-pings",

      // Google won't mangle URLs in current Chrome versions, relying on pings instead
      "--user-agent=Firefox/40.0"
    ],

    ignoreDefaultArgs: [
      "--disable-extensions"
    ],

    // Extensions are unsupported in headless Chrome, see
    // https://bugs.chromium.org/p/chromium/issues/detail?id=706008
    headless: false
  });
};

exports.logTopLevelRequests = async function(page, handler)
{
  let requests = [];
  function logRequest(request)
  {
    if (request.resourceType() == "document")
      requests.push(request.url());
    request.continue();
  }

  await page.setRequestInterception(true);
  page.on("request", logRequest);

  try
  {
    await handler();
  }
  finally
  {
    page.off("request", logRequest);
    await page.setRequestInterception(false);
  }
  return requests;
};

exports.newTarget = async function(browser, handler)
{
  return new Promise((resolve, reject) =>
  {
    function onNewTarget(target)
    {
      browser.off("targetcreated", onNewTarget);
      resolve(target);
    }

    browser.on("targetcreated", onNewTarget);

    handler();
  });
};
