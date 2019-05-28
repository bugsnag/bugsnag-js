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
    if (exp.extra && exp.extra.bugsnag && exp.extra.bugsnag.apiKey) {
      apiKey = exp.extra.bugsnag.apiKey
    } else {
      throw new Error(
        '@bugsnag/expo postPublish hook requires your Bugsnag API key'
      )
    }

    const buildReporterConfig = (config && config.buildReporter) ? config.buildReporter : {}
    if (buildReporterConfig.disabled !== true) {
      await reportBuild(apiKey, iosManifest, projectRoot, buildReporterConfig.endpoint)
    }

    const sourceMapConfig = (config && config.sourceMapUploader) ? config.sourceMapUploader : {}
    if (sourceMapConfig.disabled !== true) {
      await uploadSourcemaps(
        apiKey,
        iosManifest,
        iosBundle,
        iosSourceMap,
        androidManifest,
        androidBundle,
        androidSourceMap,
        projectRoot,
        sourceMapConfig.endpoint
      )
    }
  } catch (e) {
    log(e)
  }
}
