import Bugsnag from '@bugsnag/browser'
import config from './lib/config'

// Start Bugsnag
Bugsnag.start(config)

// Leave a breadcrumb to demonstrate breadcrumb functionality
Bugsnag.leaveBreadcrumb('TypeScript 3.8 test fixture loaded', {
  timestamp: new Date().toISOString(),
  version: 'TypeScript 3.8'
})

// Report an error to demonstrate error reporting
Bugsnag.notify(new Error('TypeScript 3.8 compatibility test error'))
