module.exports = {
  releaseStage: {
    defaultValue: () => {
      if (/^localhost(:\d+)?$/.test(window.location.host)) return 'development'
      return 'production'
    },
    message: '(string) releaseStage should be set',
    validate: value => typeof value === 'string' && value.length
  },
  collectUserIp: {
    defaultValue: () => true,
    message: '(boolean) collectUserIp should true/false',
    validate: value => value === true || value === false
  }
}
