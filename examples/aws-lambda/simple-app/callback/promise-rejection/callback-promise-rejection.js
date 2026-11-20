const Bugsnag = require('@bugsnag/js')
const BugsnagPluginAwsLambda = require('@bugsnag/plugin-aws-lambda')

Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY,
  plugins: [BugsnagPluginAwsLambda]
})

const bugsnagHandler = Bugsnag.getPlugin('awsLambda').createHandler()

const handler = (_event, _context, callback) => {
  Promise.reject(new Error('yikes - a rejected promise!'))

  callback(null, {
    statusCode: 200,
    body: JSON.stringify({ message: 'Did not crash!' })
  })
}

module.exports.lambdaHandler = bugsnagHandler(handler)
