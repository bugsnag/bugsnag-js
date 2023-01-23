const Bugsnag = require('@bugsnag/js')
const BugsnagPluginAwsLambda = require('@bugsnag/plugin-aws-lambda')

Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY,
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  },
  plugins: [BugsnagPluginAwsLambda],
  autoDetectErrors: process.env.BUGSNAG_AUTO_DETECT_ERRORS !== 'false',
  autoTrackSessions: process.env.BUGSNAG_AUTO_TRACK_SESSIONS !== 'false'
})

const bugsnagHandler = Bugsnag.getPlugin('awsLambda').createHandler()

const handler = async (event, context) => {
  setTimeout(() => {
    throw new Error('Oh no!')
  }, 100)

  await new Promise(resolve => setTimeout(resolve, 1000))

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Did not crash immediately!' })
  }
}

module.exports.lambdaHandler = bugsnagHandler(handler)
