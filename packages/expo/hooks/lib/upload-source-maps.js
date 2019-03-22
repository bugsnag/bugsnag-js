const { upload } = require('bugsnag-sourcemaps')
const { promisify } = require('util')
const { tmpdir } = require('os')
const { sep, join } = require('path')
const { mkdtemp, writeFile } = require('fs')

module.exports = async (
  apiKey,
  iosManifest,
  iosBundle,
  iosSourceMap,
  androidManifest,
  androidBundle,
  androidSourceMap,
  projectRoot
) => {
  const dir = await makeTmpDir()

  const androidBundlePath = join(dir, 'android.bundle.js')
  const androidSourceMapPath = join(dir, 'android.bundle.js.map')

  const iosBundlePath = join(dir, 'ios.bundle.js')
  const iosSourceMapPath = join(dir, 'ios.bundle.js.map')

  await promisify(writeFile)(iosSourceMapPath, iosSourceMap, 'utf-8')
  await promisify(writeFile)(iosBundlePath, iosBundle, 'utf-8')

  await promisify(writeFile)(androidSourceMapPath, androidSourceMap, 'utf-8')
  await promisify(writeFile)(androidBundlePath, androidBundle, 'utf-8')

  // android
  await upload({
    apiKey,
    appVersion: androidManifest.version,
    minifiedUrl: '*/cached-bundle-experience-*',
    minifiedFile: androidBundlePath,
    codeBundleId: androidManifest.revisionId,
    sourceMap: androidSourceMapPath
  })

  // ios
  await upload({
    apiKey,
    appVersion: iosManifest.version,
    minifiedUrl: iosManifest.bundleUrl, // WRONG!
    minifiedFile: iosBundlePath,
    codeBundleId: iosManifest.revisionId,
    sourceMap: iosSourceMapPath
  })
}

const makeTmpDir = async () => promisify(mkdtemp)(`${tmpdir()}${sep}bugsnag-expo-`)
