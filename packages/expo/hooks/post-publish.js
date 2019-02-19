const { upload } = require('bugsnag-sourcemaps')
const { reportBuild } = require('bugsnag-build-reporter')

module.exports = async ({
  config,
  url,
  log,
  iosBundle,
  iosSourceMap,
  iosManifest,
  androidBundle,
  androidSourceMap,
  androidManifest,
  projectRoot,
  exp
}) => {
  try {
    log('beep boop')
    log(url)
    log(exp)
  } catch (e) {
    log(e)
  }
}
