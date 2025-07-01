const handle = require('hono/aws-lambda').handle
const Bugsnag = require('@bugsnag/js')
const BugsnagPluginAwsLambda = require('@bugsnag/plugin-aws-lambda')
const BugsnagPluginHono = require('@bugsnag/plugin-hono')

Bugsnag.start({
  apiKey: process.env.BUGSNAG_API_KEY,
  plugins: [BugsnagPluginAwsLambda, BugsnagPluginHono],
  endpoints: {
    notify: process.env.BUGSNAG_NOTIFY_ENDPOINT,
    sessions: process.env.BUGSNAG_SESSIONS_ENDPOINT
  },
  autoDetectErrors: process.env.BUGSNAG_AUTO_DETECT_ERRORS !== 'false',
  autoTrackSessions: process.env.BUGSNAG_AUTO_TRACK_SESSIONS !== 'false'
})

const app = require('./app')

const bugsnagHandler = Bugsnag.getPlugin('awsLambda').createHandler()
const honoHandler = handle(app)
module.exports.lambdaHandler = bugsnagHandler(honoHandler)
