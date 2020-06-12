/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

"use strict";

import * as utils from "../test-utils.js";

const searchFieldSelector = "[name=q]";
const searchResultSelector = "#search .r > a";

describe("Google Search", () =>
{
  let browser;
  let page;
  let href;

  it("should load", async function()
  {
    browser = await utils.launchBrowser();
    page = await browser.newPage();
    await page.goto("https://www.google.com/?gfe_rd=cr&hl=en");
  });

  it("should allow searching", async function()
  {
    let searchField = await page.$(searchFieldSelector);
    expect(searchField).to.be.not.null;

    await searchField.type("site:palant.de\n");
    await page.waitForSelector(searchResultSelector);
  });

  it("should not link to Google in results", async function()
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

  it("shouldn't navigate to search result via intermediate URLs when clicked", async function()
  {
    let result = await page.$(searchResultSelector);

    let requests = await utils.logTopLevelRequests(page, async function()
    {
      await result.click();
      await page.waitForNavigation();
    });

    try
    {
      expect(await page.url()).to.be.equal(href);
      expect(requests).to.be.deep.equal([href]);
    }
    finally
    {
      await page.goBack();
    }
  });

  it("shouldn't navigate to search result via intermediate URLs when Enter is pressed", async function()
  {
    let result = await page.$(searchResultSelector);

    let requests = await utils.logTopLevelRequests(page, async function()
    {
      await result.press("Enter");
      await page.waitForNavigation();
    });

    try
    {
      expect(await page.url()).to.be.equal(href);
      expect(requests).to.be.deep.equal([href]);
    }
    finally
    {
      await page.goBack();
    }
  });

  it("should shut down", async function()
  {
    await browser.close();
  });
});
