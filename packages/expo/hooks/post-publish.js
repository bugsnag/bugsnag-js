const reportBuild = require('./lib/report-build')
const uploadSourcemaps = require('./lib/upload-source-maps')

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
    let apiKey
    if (config && config.apiKey) {
      apiKey = config.apiKey
    } else if (exp.extra.bugsnag && exp.extra.bugsnag.apiKey) {
      apiKey = exp.extra.bugsnag.apiKey
    } else {
      throw new Error('@bugsnag/expo postPublish hook requires your Bugsnag API key')
    }
    if (!config || config.reportBuild !== false) {
      await reportBuild(apiKey, iosManifest, projectRoot)
    }
    if (!config || config.uploadSourcemaps !== false) {
      await uploadSourcemaps(
        apiKey,
        iosManifest,
        iosBundle,
        iosSourceMap,
        androidManifest,
        androidBundle,
        androidSourceMap,
        projectRoot
      )
    }
  } catch (e) {
    log(e)
  }
}
