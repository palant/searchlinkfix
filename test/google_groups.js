/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

"use strict";

import * as utils from "../test-utils.js";

const searchResultSelector = "[href*='github.com']";

describe("Google Groups", () =>
{
  let browser;
  let page;
  let href;

  it("should load", async function()
  {
    browser = await utils.launchBrowser();
    page = await browser.newPage();
    await page.goto("https://groups.google.com/forum/?hl=en#!msg/play-framework/ZfmjuYnZrzg/2hx2zgq_GugJ");
    await page.waitForSelector(searchResultSelector);
  });

  it("should not redirect links to Google initially", async function()
  {
    let result = await page.$(searchResultSelector);
    expect(result).to.be.not.null;

    href = await result.getHref();
    expect(href).to.not.include("google.com");
  });


  it("shouldn't change link on hover", async function()
  {
    let result = await page.$(searchResultSelector);

    await result.hover();
    await page.waitFor(200);
    expect(await result.getHref()).to.equal(href);
  });

  it("shouldn't change link on right-click", async function()
  {
    let result = await page.$(searchResultSelector);

    await result.click({button: "right"});
    await page.waitFor(200);
    expect(await result.getHref()).to.be.equal(href);
  });

  it("shouldn't change link on middle-click", async function()
  {
    let result = await page.$(searchResultSelector);

    let target = await utils.newTarget(browser, async function()
    {
      await result.click({button: "middle"});
    });
    expect(target.url()).to.be.equal(href);

    let tab = await target.page();
    await tab.close();

    await page.waitFor(200);
    expect(await result.getHref()).to.be.equal(href);
  });

  it("shouldn't change link on click", async function()
  {
    let result = await page.$(searchResultSelector);

    let target = await utils.newTarget(browser, async function()
    {
      await result.click();
    });
    expect(target.url()).to.be.equal(href);

    let tab = await target.page();
    await tab.close();

    await page.waitFor(200);
    expect(await result.getHref()).to.be.equal(href);
  });

  it("should open apps listing when Google Apps button is clicked", async function()
  {
    let link = await page.$("a[title='Google apps']");
    expect(link).to.be.not.null;

    await link.click();
    await page.waitForSelector("div[aria-label='Google apps']");
  });

  it("should shut down", async function()
  {
    await browser.close();
  });
});
