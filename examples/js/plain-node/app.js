// include Bugsnag from the installed dependencies
var Bugsnag = require('@bugsnag/js')

// initialise Bugsnag with some basic options
Bugsnag.start({
  // this loads the apiKey from the environment so be sure to pass it in
  apiKey: 'd6f10d9e0331127fae23b181fc0e9355',
  // setting the appVersion is useful to track when errors are introduced/fixed
  appVersion: '1.2.3',
  // using a combination of releaseStage/enabledReleaseStages you can ensure you
  // only get reports from the environments you care about
  releaseStage: 'production',
  enabledReleaseStages: [ 'staging', 'production' ],
  // you can set global metadata when you initialise Bugsnag
  metadata: {}
})

console.log(`
  Welcome to the plain Node.js example app. Type one of the
  following keys, followed by enter, to perform each action:

  u = report an (u)nhandled error
    Throws an error which will crash the process. Bugsnag will keep the process
    alive just long enough to report the error before allowing it to exit.

  h = report a (h)andled error
    Creates a new error and reports it with a call to .notify(err).

  o = calling notify with an (o)n error callback
    Runs custom logic before an event is sent. This contrived example will
    pseudo-randomly prevent 50% of the events from sending.
`)

process.stdin.resume()
process.stdin.on('data', function (d) {
  d = String(d).replace(/\s+/g, '')
  switch (d) {
    case 'u': return unhandledError()
    case 'h': return handledError()
    case 'l': return leaveBreadcrumb()
    case 'o': return onError()
    default: return unknown(d)
  }
})

function unknown (str) {
  console.log(`nothing configured for "${str}"`)
}

function unhandledError () {
  console.log('throwing an error…')
  // unhandled exceptions and unhandled promise rejections are detected automatically
  throw new Error('unresolveable musical differences')
}

function handledError () {
  console.log('notifying of a handled error…')
  // you can notify Bugsnag of errors you handled or created yourself
  Bugsnag.notify(new Error('scheduling clash'))
}

function leaveBreadcrumb () {
  console.log('leaving a breadcrumb…')
  // you can record all kinds of events which will be sent along with error reports
  // these can help when trying to understand the conditions leading up to an error
  Bugsnag.leaveBreadcrumb('network blip')
}

function onError () {
  console.log('calling notify() with an onError callback…')
  // onError can be used to modify an event or prevent it from being sent at all
  // this example pseudo-randomly filters out approximately half of the events
  Bugsnag.notify(new Error('sometimes will send'), (event) => {
    const n = Math.random()
    if (n <= 0.5) return false
  })
}
