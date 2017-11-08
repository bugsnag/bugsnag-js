module.exports = {
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
