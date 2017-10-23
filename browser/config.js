module.exports = {
  projectRoot: {
    defaultValue: () => `${window.location.protocol}//${window.location.host}`,
    message: '(String) projectRoot must be set',
    validate: value => typeof value === 'string' && value.length
  }
}
