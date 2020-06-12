/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

"use strict";

import * as utils from "../test-utils.js";

const searchResultSelector1 = "[data-cid^=GRID] a[target=_blank]";
const searchResultSelector2 = "[data-hp=imgrc] a[role=button][target=_blank]";

function stripAnchor(url)
{
  url = new URL(url);
  url.hash = "";
  return url.toString();
}

describe("Google Image Search", () =>
{
  let browser;
  let page;
  let results = [];

  it("should load", async function()
  {
    browser = await utils.launchBrowser();
    page = await browser.newPage();
    await page.goto("https://www.google.com/search?hl=en&tbm=isch&q=site:palant.info");
  });

  it("should allow searching and opening images without reloading page", async function()
  {
    let image = await page.waitForSelector("[data-cid^=GRID] img", {visible: true});
    await image.click();
    await page.waitForSelector("[data-hp=imgrc]", {visible: true});

    let links = [await page.$(searchResultSelector1), await page.$(searchResultSelector2)];
    for (let link of links)
    {
      if (await link.boxModel() === null)
        continue;   // invisible
      results.push({
        link,
        href: await link.getHref()
      });
    }
    expect(results).to.be.not.empty;
  });

  it("should not link to Google", async function()
  {
    for (let {link, href} of results)
      expect(href).to.not.include("google.com");
  });

  it("shouldn't change links on hover", async function()
  {
    for (let {link, href} of results)
    {
      await link.hover();
      await page.waitFor(200);
      expect(await link.getHref()).to.equal(href);
    }
  });

  it("shouldn't change links on right-click", async function()
  {
    for (let {link, href} of results)
    {
      await link.click({button: "right"});
      await page.waitFor(200);
      expect(await link.getHref()).to.be.equal(href);
    }
  });

  it("shouldn't change link on middle-click", async function()
  {
    for (let {link, href} of results)
    {
      let target = await utils.newTarget(browser, async function()
      {
        await link.click({button: "middle"});
      });
      expect(target.url()).to.be.equal(href);

      let tab = await target.page();
      await tab.close();

      await page.waitFor(200);
      expect(await link.getHref()).to.be.equal(href);
    }
  });

  it("shouldn't change link on click", async function()
  {
    for (let {link, href} of results)
    {
      let target = await utils.newTarget(browser, async function()
      {
        await link.click();
      });
      expect(target.url()).to.be.equal(href);

      let tab = await target.page();
      await tab.close();

      await page.waitFor(200);
      expect(await link.getHref()).to.be.equal(href);
    }
  });

  it("should open apps listing when Google Apps button is clicked", async function()
  {
    let link = await page.$("a[aria-label='Google apps']");
    expect(link).to.be.not.null;

    await link.click();
    await page.waitForSelector("iframe[src^='https://ogs.google.com/widget/app/']");
  });

  it("should shut down", async function()
  {
    await browser.close();
  });
});
