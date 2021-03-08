const Bugsnag = require('@bugsnag/js')
const BugsnagPluginAwsLambda = require('@bugsnag/plugin-aws-lambda')
const BugsnagPluginExpress = require('@bugsnag/plugin-express')
const serverlessExpress = require('@vendia/serverless-express')

Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY,
  plugins: [BugsnagPluginAwsLambda, BugsnagPluginExpress],
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  },
  autoDetectErrors: process.env.BUGSNAG_AUTO_DETECT_ERRORS !== 'false',
  autoTrackSessions: process.env.BUGSNAG_AUTO_TRACK_SESSIONS !== 'false'
})

const app = require('./app')

const bugsnagHandler = Bugsnag.getPlugin('awsLambda').createHandler()
const serverlessExpressHandler = serverlessExpress({ app })

exports.lambdaHandler = bugsnagHandler(serverlessExpressHandler)
