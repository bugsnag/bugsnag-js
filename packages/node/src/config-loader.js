const { readFileSync } = require('fs')
const { join, dirname } = require('path')

const LOOKUP_PATHS = []
  .concat(
    // current directory of the process
    process.cwd()
  )
  .concat(
    // directory of the app's entrypoint
    process.mainModule ? dirname(process.mainModule.filename) : []
  )

const findPackageConfig = () => {
  return LOOKUP_PATHS.reduce((accum, p) => {
    if (accum) return accum
    try {
      const pkg = readFileSync(join(process.cwd(), 'package.json'), 'utf8')
      if (!pkg) return accum
      const { bugsnag } = JSON.parse(pkg)
      if (bugsnag && typeof bugsnag === 'object') return bugsnag
      return accum
    } catch (e) {
      return accum
    }
  }, null)
}

module.exports = () => ({
  ...findPackageConfig()
})
