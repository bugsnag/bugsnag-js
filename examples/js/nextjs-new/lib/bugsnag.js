import Bugsnag from '@bugsnag/js'
import BugsnagPluginAwsLambda from '@bugsnag/plugin-aws-lambda'

export function start() {
  // TODO NEXT_PHASE seems to be undocumented. We're doing this because we don't want
  // Bugsnag to run during the build phase
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    const plugins = process.env.NEXT_IS_SERVER === 'true' ? [BugsnagPluginAwsLambda] : [];
    Bugsnag.start({
      apiKey: process.env.NEXT_PUBLIC_BUGSNAG_API_KEY,
      appVersion: process.env.NEXT_BUILD_ID,
      plugins,
    })
  }
}

export function getServerlessHandler() {
  return Bugsnag.getPlugin('awsLambda').createHandler()
}


