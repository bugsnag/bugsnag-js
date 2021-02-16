const Bugsnag = require('@bugsnag/js')

Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY,
  plugins: []
})

const handler = async (event, context) => {
  Bugsnag.notify(new Error('Hello!'))

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Did not crash!' })
  }
}

module.exports.lambdaHandler = handler
