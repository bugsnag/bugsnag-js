module.exports = () => {
  return {
    appType: 'mixed-bundle',
    appVersion: '1.0.0',
    codeBundleId: 'main-bundle-abc123',
    releaseStage: 'test'
  }
}

module.exports.renderer = () => {
  return {
    codeBundleId: 'renderer-bundle-xyz789'
  }
}
