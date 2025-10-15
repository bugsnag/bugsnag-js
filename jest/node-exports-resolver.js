const fs = require('fs')
const path = require('path')
const packageUp = require('pkg-up')

const defaultConditions = ['require', 'node', 'default']

function findMainPackageJson (entryPath, packageName) {
  entryPath = entryPath.replace(/\//g, path.sep)

  let directoryName = path.dirname(entryPath)

  let suspect = packageUp.sync({ cwd: directoryName })
  if (fs.existsSync(suspect)) {
    return JSON.parse(fs.readFileSync(suspect).toString())
  }

  while (directoryName && !directoryName.endsWith(packageName)) {
    const parentDirectoryName = path.resolve(directoryName, '..')

    if (parentDirectoryName === directoryName) break

    directoryName = parentDirectoryName
  }

  suspect = path.resolve(directoryName, 'package.json')
  if (fs.existsSync(suspect)) {
    return JSON.parse(fs.readFileSync(suspect).toString())
  }

  return null
}

function getSelfReferencePath (packageName) {
  let parentDirectoryName = __dirname
  let directoryName

  while (directoryName !== parentDirectoryName) {
    directoryName = parentDirectoryName

    try {
      const { name } = require(path.resolve(directoryName, 'package.json'))

      if (name === packageName) return directoryName
    } catch {}

    parentDirectoryName = path.resolve(directoryName, '..')
  }
}

function getPackageJson (packageName) {
  // Require `package.json` from the package, both from exported `exports` field
  // in ESM packages, or directly from the file itself in CommonJS packages.
  try {
    return require(`${packageName}/package.json`)
  } catch (requireError) {
    if (requireError.code === 'MODULE_NOT_FOUND') {
      return null
    }
    if (requireError.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
      return console.error(
        `Unexpected error while requiring ${packageName}:`, requireError
      )
    }
  }

  // modules's `package.json` does not provide the "./package.json" path at it's
  // "exports" field. Get package level export or main field and try to resolve
  // the package.json from it.
  try {
    const requestPath = require.resolve(packageName)

    return requestPath && findMainPackageJson(requestPath, packageName)
  } catch (resolveError) {
    if (resolveError.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
      console.log(
        `Unexpected error while performing require.resolve(${packageName}):`
      )

      return console.error(resolveError)
    }
  }

  // modules's `package.json` does not provide a package level export nor main
  // field. Try to find the package manually from `node_modules` folder.
  const suspect = path.resolve(__dirname, '..', packageName, 'package.json')
  if (fs.existsSync(suspect)) {
    return JSON.parse(fs.readFileSync(suspect).toString())
  }

  console.warn(
    'Could not retrieve package.json neither through require (package.json ' +
    'itself is not within "exports" field), nor through require.resolve ' +
    '(package.json does not specify "main" field) - falling back to default ' +
    'resolver logic'
  )
}

module.exports = (request, options) => {
  const { conditions = defaultConditions, defaultResolver } = options

  // NOTE: jest-sequencer is a special prefixed jest request
  const isNodeModuleRequest =
  !(
    request.startsWith('.') ||
    path.isAbsolute(request) ||
    request.startsWith('jest-sequencer')
  )

  if (isNodeModuleRequest) {
    const pkgPathParts = request.split('/')
    const { length } = pkgPathParts

    let packageName
    let submoduleName

    if (!request.startsWith('@')) {
      packageName = pkgPathParts.shift()
      submoduleName = length > 1 ? `./${pkgPathParts.join('/')}` : '.'
    } else if (length >= 2) {
      packageName = `${pkgPathParts.shift()}/${pkgPathParts.shift()}`
      submoduleName = length > 2 ? `./${pkgPathParts.join('/')}` : '.'
    }

    if (packageName) {
      const selfReferencePath = getSelfReferencePath(packageName)
      if (selfReferencePath) packageName = selfReferencePath

      const packageJson = getPackageJson(packageName)

      if (packageJson) {
        const { exports } = packageJson || {}
        if (exports) {
          let targetFilePath

          if (typeof exports === 'string') { targetFilePath = exports } else if (Object.keys(exports).every((k) => k.startsWith('.'))) {
            const [exportKey, exportValue] = Object.entries(exports)
              .find(([k]) => {
                if (k === submoduleName) return true
                if (k.endsWith('*')) return submoduleName.startsWith(k.slice(0, -1))

                return false
              }) || []

            if (typeof exportValue === 'string') {
              targetFilePath = exportKey.endsWith('*')
                ? exportValue.replace(
                  /\*/, submoduleName.slice(exportKey.length - 1)
                )
                : exportValue
            } else if (
              conditions && exportValue != null && typeof exportValue === 'object'
            ) {
              function resolveExport (exportValue, prevKeys) {
                for (const [key, value] of Object.entries(exportValue)) {
                  // Duplicated nested conditions are undefined behaviour (and
                  // probably a format error or spec loop-hole), abort and
                  // delegate to Jest default resolver
                  if (prevKeys.includes(key)) return

                  if (!conditions.includes(key)) continue

                  if (typeof value === 'string') return value

                  return resolveExport(value, prevKeys.concat(key))
                }
              }

              targetFilePath = resolveExport(exportValue, [])
            }
          }

          if (targetFilePath) {
            request = targetFilePath.replace('./', `${packageName}/`)
          }
        }
      }
    }
  }

  return defaultResolver(request, options)
}
