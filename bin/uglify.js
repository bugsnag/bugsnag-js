#!/usr/bin/env node

var fs = require("fs");
var UglifyJS = require("uglifyjs");
var version = require("../package.json").version;

var ast = UglifyJS.parse(fs.readFileSync("src/bugsnag.js").toString("utf8"), {
  filename: "bugsnag-" + version + ".js"
});

var compressor = UglifyJS.Compressor({
  warnings: false,
  global_defs: { //eslint-disable-line camelcase
    BUGSNAG_TESTING: void 0
  }
});

ast.figure_out_scope();
ast = ast.transform(compressor);
ast.figure_out_scope();
ast.mangle_names();

var sourceMap = UglifyJS.SourceMap({
  file: "bugsnag-" + version + ".min.js",
  root: "https://d2wy8f7a9ursnm.cloudfront.net/"
});

var stream = UglifyJS.OutputStream({
  source_map: sourceMap //eslint-disable-line camelcase
});

ast.print(stream);

fs.mkdir("dist", function() {
  fs.writeFileSync("dist/bugsnag.min.js", stream.toString());
  console.log("dist/bugsnag.min.js (v" + version + ")");

  fs.writeFileSync("dist/bugsnag.min.map", sourceMap.toString());
  console.log("dist/bugsnag.min.map (v" + version + ")");
});
