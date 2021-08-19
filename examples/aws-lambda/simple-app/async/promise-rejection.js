const Bugsnag = require('@bugsnag/js')
const BugsnagPluginAwsLambda = require('@bugsnag/plugin-aws-lambda')

Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY,
  plugins: [BugsnagPluginAwsLambda]
})

const bugsnagHandler = Bugsnag.getPlugin('awsLambda').createHandler()

const handler = async (_event, _context) => {
  Promise.reject(new Error('yikes - a rejected promise!'))

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Did not crash!' })
  }
}

module.exports.lambdaHandler = bugsnagHandler(handler)
