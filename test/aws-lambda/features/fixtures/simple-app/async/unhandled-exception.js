const Bugsnag = require('@bugsnag/js')

Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY,
  plugins: []
})

const handler = async (event, context) => {
  throw new Error('Oh no!')
}

module.exports.lambdaHandler = handler
