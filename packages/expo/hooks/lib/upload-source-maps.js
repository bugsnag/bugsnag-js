const sourceMaps = require('@bugsnag/source-maps').reactNative
const logger = require('@bugsnag/source-maps/dist/Logger').default
const { promisify } = require('util')
const { tmpdir } = require('os')
const { sep, join } = require('path')
const { mkdtemp, writeFile } = require('fs')

const writeFileAsync = promisify(writeFile)

module.exports = async (
  apiKey,
  iosManifest,
  iosBundle,
  iosSourceMap,
  androidManifest,
  androidBundle,
  androidSourceMap,
  projectRoot,
  endpoint
) => {
  const dir = await makeTmpDir()

  const androidBundlePath = join(dir, 'android.bundle.js')
  const androidSourceMapPath = join(dir, 'android.bundle.js.map')

  const iosBundlePath = join(dir, 'ios.bundle.js')
  const iosSourceMapPath = join(dir, 'ios.bundle.js.map')

  await writeFileAsync(iosSourceMapPath, iosSourceMap, 'utf-8')
  await writeFileAsync(iosBundlePath, iosBundle, 'utf-8')

  await writeFileAsync(androidSourceMapPath, androidSourceMap, 'utf-8')
  await writeFileAsync(androidBundlePath, androidBundle, 'utf-8')

  const opts = { apiKey }
  if (endpoint) opts.endpoint = endpoint

  logger.info('Uploading source maps to Bugsnag')

  // android
  await sourceMaps.uploadOne({
    ...opts,
    appVersion: androidManifest.version,
    codeBundleId: androidManifest.revisionId,
    bundle: androidBundlePath,
    sourceMap: androidSourceMapPath,
    platform: 'android',
    logger
  })

  // ios
  await sourceMaps.uploadOne({
    ...opts,
    appVersion: iosManifest.version,
    codeBundleId: iosManifest.revisionId,
    bundle: iosBundlePath,
    sourceMap: iosSourceMapPath,
    platform: 'ios',
    logger
  })
}

const makeTmpDir = async () => promisify(mkdtemp)(`${tmpdir()}${sep}bugsnag-expo-`)
