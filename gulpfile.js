/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const url = require("url");

const del = require("del");
const gulp = require("gulp");
const eslint = require("gulp-eslint");
const mocha = require("gulp-mocha");
const zip = require("gulp-zip");

const utils = require("./gulp-utils");

let sources = ["manifest.json", "data/**/*", "_locales/**/*", "icon*.png", "LICENSE.txt"];

function getBuildFileName(extension)
{
  let filename = utils.readArg("--outfile=");
  if (!filename)
  {
    let manifest = require("./manifest.json");
    filename = "searchlinkfix-" + manifest.version + "." + extension;
  }

  let dir = "";
  if (path.isAbsolute(filename))
  {
    dir = path.dirname(filename);
    filename = path.basename(filename);
  }

  return [dir, filename];
}

function modifyManifest(modifier)
{
  return utils.transform((filepath, contents) =>
  {
    let manifest = JSON.parse(contents);
    manifest = modifier(manifest) || manifest;
    return utils.download("https://www.google.com/supported_domains").then(data =>
    {
      let additionalDomains = data.trim().split(/\s+/).map(domain => `*://*${domain}/*`);
      additionalDomains.sort();
      manifest.content_scripts[0].matches.unshift(...additionalDomains);
      return [filepath, JSON.stringify(manifest, null, 2)];
    });
  }, {files: ["manifest.json"]});
}

function modifyCRXManifest(manifestData)
{
  delete manifestData.applications;
}

function buildZIP(filename, manifestModifier)
{
  return gulp.src(sources, {cwdbase: true})
      .pipe(modifyManifest(manifestModifier))
      .pipe(zip(filename));
}

gulp.task("eslint", function()
{
  return gulp.src(["*.js", "data/**/*.js", "testhelper/**/*.js", "tests/**/*.js"])
             .pipe(eslint())
             .pipe(eslint.format())
             .pipe(eslint.failAfterError());
});

gulp.task("validate", gulp.parallel("eslint"));

gulp.task("xpi", gulp.series("validate", function buildXPI()
{
  let manifest = require("./manifest.json");
  let [dir, filename] = getBuildFileName("xpi");
  return buildZIP(filename, function(manifestData)
  {
    delete manifestData.minimum_chrome_version;
    delete manifestData.minimum_opera_version;
    manifestData.permissions = ["http://*/*", "https://*/*"];
  }).pipe(gulp.dest(dir || process.cwd()));
}));

gulp.task("crx", gulp.series("validate", function buildCRX()
{
  let [dir, filename] = getBuildFileName("zip");
  return buildZIP(filename, modifyCRXManifest).pipe(gulp.dest(dir || process.cwd()));
}));

gulp.task("unpacked-crx", gulp.series("validate", function buildUnpackedCRX()
{
  return gulp.src(sources, {cwdbase: true})
      .pipe(modifyManifest(modifyCRXManifest))
      .pipe(gulp.dest("crx-unpacked"));
}));

gulp.task("test", gulp.series("unpacked-crx", function runTests()
{
  let testFile = utils.readArg("--test=");
  if (!testFile)
    testFile = "**/*.js";
  else if (!testFile.endsWith(".js"))
    testFile += ".js";

  return gulp.src("test/" + testFile)
             .pipe(mocha({
               timeout: 30000
             }));
}));

gulp.task("clean", function()
{
  return del(["crx-unpacked", "*.xpi", "*.zip", "*.crx"]);
});

gulp.task("all", gulp.parallel("xpi", "crx"));
gulp.task("default", gulp.parallel("all"));
