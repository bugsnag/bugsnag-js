const reportBuild = require('bugsnag-build-reporter')

module.exports = async (apiKey, manifest, projectRoot) => {
  const { revisionId, version } = manifest
  await reportBuild({
    apiKey,
    appVersion: version,
    metadata: { [`bundle@${new Date().toISOString()}`]: revisionId }
  }, { path: projectRoot })
}
