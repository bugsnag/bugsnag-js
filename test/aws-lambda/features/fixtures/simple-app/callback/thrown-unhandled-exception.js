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

const handler = (event, context, callback) => {
  throw new Error('Oh no!')
}

module.exports.lambdaHandler = bugsnagHandler(handler)
