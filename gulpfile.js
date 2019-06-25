/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the "License"). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

"use strict";

let {spawn} = require("child_process");
let fs = require("fs");
let path = require("path");
let url = require("url");

let del = require("del");
let gulp = require("gulp");
let eslint = require("gulp-eslint");
let zip = require("gulp-zip");
let merge = require("merge-stream");
let request = require("request");

let utils = require("./gulp-utils");

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

function buildZIP(filename, manifestModifier)
{
  return gulp.src(sources, {cwdbase: true})
      .pipe(modifyManifest(manifestModifier))
      .pipe(zip(filename));
}

gulp.task("eslint", function()
{
  return gulp.src(["*.js", "data/**/*.js", "testhelper/**/*.js"])
             .pipe(eslint())
             .pipe(eslint.format())
             .pipe(eslint.failAfterError());
});

gulp.task("validate", gulp.parallel("eslint"));

gulp.task("xpi", gulp.series("validate", function()
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

gulp.task("crx", gulp.series("validate", function()
{
  let [dir, filename] = getBuildFileName("zip");
  return buildZIP(filename, function(manifestData)
  {
    delete manifestData.applications;
  }).pipe(gulp.dest(dir || process.cwd()));
}));

gulp.task("build-edge", gulp.series("validate", function()
{
  let version = require("./manifest.json").version;
  while (version.split(".").length < 4)
    version += ".0";

  return merge(
    gulp.src(["edge/**/*.xml", "edge/**/*.png"])
        .pipe(utils.transform((filepath, contents) =>
        {
          return [filepath, contents.replace(/{{version}}/g, version)];
        }), {files: ["appxmanifest.xml"]})
        .pipe(gulp.dest("build-edge/extension")),
    gulp.src("_locales/*/messages.json")
        .pipe(utils.transform((filepath, contents) =>
        {
          let data = JSON.parse(contents);
          contents = JSON.stringify({
            "DisplayName": data.name.message,
            "_DisplayName.comment": "",
            "Description": data.description.message,
            "_Description.comment": ""
          }, null, 2);
          let locale = path.basename(path.dirname(filepath));
          return [`${locale}/resources.resjson`, contents];
        }))
        .pipe(gulp.dest("build-edge/extension/Resources/<locale>")),
    gulp.src(sources, {base: process.cwd()})
        .pipe(modifyManifest(manifestData =>
        {
          manifestData.permissions = ["http://*/*", "https://*/*"];
        }))
        .pipe(gulp.dest("build-edge/extension/Extension"))
  );
}));

gulp.task("build-edge/extension.zip", gulp.series("build-edge", function()
{
  return gulp.src([
    "build-edge/**",
    "!build-edge/**/*.zip"
  ]).pipe(zip("extension.zip")).pipe(gulp.dest("build-edge"));
}));

gulp.task("appx", gulp.series("build-edge/extension.zip", function(callback)
{
  let [dir, filename] = getBuildFileName("appx");

  const endpoint = "https://cloudappx.azurewebsites.net/v3/build";
  let req = request.post({
    url: endpoint,
    encoding: null
  }, (err, response, responseBody) =>
  {
    if (err)
    {
      callback(err);
      return;
    }

    if (response.statusCode != 200)
    {
      callback(new Error(`Calling CloudAppX service failed: ${response.statusCode} ${response.statusMessage} (${responseBody})`));
      return;
    }

    fs.writeFile(path.join(dir, filename), responseBody, callback);
  });

  req.form().append("xml", fs.createReadStream("build-edge/extension.zip"));
}));

gulp.task("test", gulp.series("validate", function()
{
  let firefoxPath = utils.readArg("--firefox-path=");
  if (!firefoxPath)
    throw new Error("--firefox-path parameter is required for integration tests");

  return new Promise((resolve, reject) =>
  {
    let script = path.resolve(process.cwd(), "run_tests.py");
    let ps = spawn(script, [firefoxPath]);
    ps.stdout.pipe(process.stdout);
    ps.stderr.pipe(process.stderr);
    ps.on("close", resolve);
  });
}));

gulp.task("clean", function()
{
  return del(["build-edge", "*.xpi", "*.zip", "*.crx", "*.appx"]);
});

gulp.task("all", gulp.parallel("xpi", "crx", "appx"));
gulp.task("default", gulp.parallel("all"));
