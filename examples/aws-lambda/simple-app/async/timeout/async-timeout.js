const Bugsnag = require('@bugsnag/js')
const BugsnagPluginAwsLambda = require('@bugsnag/plugin-aws-lambda')

Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY,
  plugins: [BugsnagPluginAwsLambda]
})

const bugsnagHandler = Bugsnag.getPlugin('awsLambda').createHandler({
  lambdaTimeoutNotifyMs: 2000 // set to notify 2000ms before timeout  (default)
})

// due to a bug in AWS lambda this will not notify when running with SAM CLI: https://github.com/aws/aws-sam-cli/issues/2519
const handler = async (_event, _context) => {
  await new Promise((resolve) => setTimeout(resolve, 4000)) // function timeout is 3000ms as per template.yaml

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Did not crash!' })
  }
}

module.exports.lambdaHandler = bugsnagHandler(handler)
