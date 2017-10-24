module.exports = {
  projectRoot: {
    defaultValue: () => `${window.location.protocol}//${window.location.host}`,
    message: '(String) projectRoot must be set',
    validate: value => typeof value === 'string' && value.length
  },
  releaseStage: {
    defaultValue: () => {
      if (/^localhost(:\d+)?$/.test(window.location.host)) return 'development'
      if (process.env.NODE_ENV) return process.env.NODE_ENV
      return 'production'
    },
    message: '(String) releaseStage should be set',
    validate: value => typeof value === 'string' && value.length
  }
}
