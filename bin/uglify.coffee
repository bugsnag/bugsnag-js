#!/usr/bin/env coffee
#
fs = require 'fs'
UglifyJS = require 'uglifyjs'
version = require('../package.json').version

ast = UglifyJS.parse(fs.readFileSync('src/bugsnag.js').toString('utf8'),
  filename: "bugsnag-#{version}.js"
)

compressor = UglifyJS.Compressor(
  warnings: false # A bucket-load of 'Boolean && always false'
  global_defs: {
    BUGSNAG_TESTING: undefined
  }
)

ast.figure_out_scope()
ast = ast.transform(compressor)

ast.figure_out_scope()
ast.mangle_names()

source_map =  UglifyJS.SourceMap(
  file: "bugsnag-#{version}.min.js",
  root: 'https://d2wy8f7a9ursnm.cloudfront.net/'
)

stream = UglifyJS.OutputStream(
  source_map: source_map
)

ast.print(stream)

comment = "\n//# sourceMappingURL=//d2wy8f7a9ursnm.cloudfront.net/bugsnag-#{version}.min.map"

fs.writeFileSync('dist/bugsnag.min.js', stream.toString())
console.log "dist/bugsnag.min.js (v#{version})"
fs.writeFileSync('dist/bugsnag.min.map', source_map.toString())
console.log "dist/bugsnag.min.map (v#{version})"
