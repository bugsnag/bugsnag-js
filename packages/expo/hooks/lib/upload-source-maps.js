const { upload } = require('bugsnag-sourcemaps')
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

  // android
  console.log('Uploading Android source map')
  await upload({
    appVersion: androidManifest.version,
    minifiedUrl: '*/cached-bundle-experience-*',
    minifiedFile: androidBundlePath,
    codeBundleId: androidManifest.revisionId,
    sourceMap: androidSourceMapPath,
    ...opts
  })

  // ios
  console.log('Uploading iOS source map')
  await upload({
    appVersion: iosManifest.version,
    minifiedUrl: iosManifest.bundleUrl,
    minifiedFile: iosBundlePath,
    codeBundleId: iosManifest.revisionId,
    sourceMap: iosSourceMapPath,
    ...opts
  })
}

const makeTmpDir = async () => promisify(mkdtemp)(`${tmpdir()}${sep}bugsnag-expo-`)
