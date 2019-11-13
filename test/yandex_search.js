/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

"use strict";

const {expect} = require("chai");

const utils = require("../test-utils");

const searchResultSelector = ".content .link";

describe("Yandex Search", () =>
{
  let browser;
  let page;
  let href;

  it("should load", async function()
  {
    browser = await utils.launchBrowser();
    page = await browser.newPage();
    await page.goto("http://yandex.ru/yandsearch?text=site%3Apalant.de");
    await page.waitForSelector(searchResultSelector);
  });

  it("should not link to Yandex in results", async function()
  {
    let result = await page.$(searchResultSelector);
    expect(result).to.be.not.null;

    href = await result.getHref();
    expect(href).to.not.include("yandex.ru");
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

  it("should shut down", async function()
  {
    await browser.close();
  });
});
