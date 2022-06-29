import Bugsnag from '@bugsnag/js'

export function start() {
  // next.js executes top-level code at build time. See https://github.com/vercel/next.js/discussions/16840 for further example
  // So use NEXT_PHASE to avoid Bugsnag.start being executed during the build phase
  // See https://nextjs.org/docs/api-reference/next.config.js/introduction and https://github.com/vercel/next.js/blob/canary/packages/next/shared/lib/constants.ts#L1-L5 for 
  // more details on NEXT_PHASE
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    if (process.env.NEXT_IS_SERVER === true) {
      Bugsnag.start({
        apiKey: process.env.NEXT_PUBLIC_BUGSNAG_API_KEY,
        appVersion: process.env.NEXT_BUILD_ID,
        // @bugsnag/plugin-aws-lambda must only be imported on the server
        plugins: [require('@bugsnag/plugin-aws-lambda')]
      })
    } else {
      // If preferred two separate Bugsnag projects e.g. a javascript and a node project could be used rather than a single one
      Bugsnag.start({
        apiKey: process.env.NEXT_PUBLIC_BUGSNAG_API_KEY,
        appVersion: process.env.NEXT_BUILD_ID,
        plugins: []
      })
    };
  }
}

export function getServerlessHandler() {
  return Bugsnag.getPlugin('awsLambda').createHandler()
}


