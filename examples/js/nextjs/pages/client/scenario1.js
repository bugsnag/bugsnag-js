/**
 * Client scenario 1
 *
 * There is a top-of-module Promise that rejects, but its result is not awaited.
 */

import { PHASE_PRODUCTION_BUILD } from 'next/constants'

// Next.js executes top-level code at build time, so use NEXT_PHASE to avoid Bugsnag.start being executed during the build phase
if (process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD) {
  const doAsyncWork = () => Promise.reject(new Error('Client scenario 1'))
  doAsyncWork()
}

const Scenario1 = () => <h1>Client scenario 1</h1>

export default Scenario1
