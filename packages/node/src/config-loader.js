const { readFileSync } = require('fs')
const { join, resolve, sep } = require('path')

const getAllContainingPaths = (p) => {
  const parts = p.split(sep)
  if (parts.length < 3) return [p]
  return [p].concat(getAllContainingPaths(parts.slice(0, -1).join(sep)))
}

const LOOKUP_PATHS = []
  .concat(process.mainModule ? process.mainModule.paths.map(p => resolve(p, '..')) : [])
  .concat(getAllContainingPaths(process.cwd()))
  .reduce((accum, p) => accum.indexOf(p) !== -1 ? accum : accum.concat(p), [])

const findPackageConfig = () => {
  return LOOKUP_PATHS.reduce((accum, p) => {
    if (accum) return accum
    const pkg = readFileSync(join(process.cwd(), 'package.json'), 'utf8')
    if (!pkg) return accum
    const { bugsnag } = JSON.parse(pkg)
    if (bugsnag && typeof bugsnag === 'object') return bugsnag
    return accum
  }, null)
}

module.exports = () => ({
  ...findPackageConfig()
})
