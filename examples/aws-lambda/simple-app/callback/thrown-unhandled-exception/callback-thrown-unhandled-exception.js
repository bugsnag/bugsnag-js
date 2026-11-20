const Bugsnag = require('@bugsnag/js')
const BugsnagPluginAwsLambda = require('@bugsnag/plugin-aws-lambda')

Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY,
  plugins: [BugsnagPluginAwsLambda]
})

const bugsnagHandler = Bugsnag.getPlugin('awsLambda').createHandler()

const handler = (_event, _context, _callback) => {
  throw new Error('Oh no!')
}

module.exports.lambdaHandler = bugsnagHandler(handler)
