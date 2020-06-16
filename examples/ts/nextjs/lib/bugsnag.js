const Bugsnag = require('@bugsnag/js')
const BugsnagPluginReact = require('@bugsnag/plugin-react')
const BugsnagPluginExpress = require('@bugsnag/plugin-express')

// TODO Remove this for final example
const sharedConfig = {
  endpoints: {
    notify: 'http://localhost:8000',
    sessions: 'http://localhost:10000'
  }
}

// TODO work out how to do appVersion

if (typeof window === "undefined") {
  Bugsnag.start({
    ...sharedConfig,
    apiKey: process.env.BUGSNAG_SERVER_API_KEY,
    plugins: [new BugsnagPluginReact(), BugsnagPluginExpress],
  })
} else {
  Bugsnag.start({
    ...sharedConfig,
    apiKey: process.env.NEXT_PUBLIC_BUGSNAG_BROWSER_API_KEY,
    plugins: [new BugsnagPluginReact()],
  })
}

