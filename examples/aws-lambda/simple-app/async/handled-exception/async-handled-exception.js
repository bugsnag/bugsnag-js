const Bugsnag = require('@bugsnag/js')
const BugsnagPluginAwsLambda = require('@bugsnag/plugin-aws-lambda')

Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY,
  plugins: [BugsnagPluginAwsLambda]
})

const bugsnagHandler = Bugsnag.getPlugin('awsLambda').createHandler()

const handler = async (event, _context) => {
  Bugsnag.notify(new Error('Bad thing!'), (e) => {
    e.context = "Don't worry - I handled it"
  })
  console.log('a handled error was sent to our dashboard!')
  return {
    statusCode: 200,
    body: JSON.stringify({
      route: event.path,
      message: 'Did not crash!'
    })
  }
}

module.exports.lambdaHandler = bugsnagHandler(handler)
