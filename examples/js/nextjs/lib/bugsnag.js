import { PHASE_PRODUCTION_BUILD } from 'next/constants'
import Bugsnag from '@bugsnag/js'

export function start() {
  // Next.js executes top-level code at build time, so use NEXT_PHASE to avoid Bugsnag.start being executed during the build phase
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) return

  if (typeof window === 'undefined') {
    Bugsnag.start({
      apiKey: process.env.NEXT_PUBLIC_BUGSNAG_API_KEY,
      appVersion: process.env.NEXT_BUILD_ID,
      // @bugsnag/plugin-aws-lambda must only be imported on the server
      plugins: [require('@bugsnag/plugin-aws-lambda')],
    })
  } else {
    // If preferred two separate Bugsnag projects e.g. a javascript and a node project could be used rather than a single one
    Bugsnag.start({
      apiKey: process.env.NEXT_PUBLIC_BUGSNAG_API_KEY,
      appVersion: process.env.NEXT_BUILD_ID,
      plugins: [],
    })
  }
}

export function getServerlessHandler() {
  return Bugsnag.getPlugin('awsLambda').createHandler()
}
