const featureFlagsConfig = require('./feature-flags')
const onSendErrorConfig = require('./on-send-error')

module.exports = () => Object.assign({}, featureFlagsConfig(), onSendErrorConfig())
