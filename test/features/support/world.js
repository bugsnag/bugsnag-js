const { After, AfterAll, Before, BeforeAll, Status } = require('@cucumber/cucumber')
const { MockServer } = require('./server')
const { TestApp } = require('./app')
const { Automator } = require('./automator')
const { join } = require('path')

// Allow a longer timeout for this step, which packages the app to run the tests
BeforeAll({ timeout: 60 * 1000 }, async () => {
  global.success = true
  global.server = new MockServer()

  const address = `http://localhost:${global.server.port}`
  const endpoints = {
    minidumps: `${address}/minidumps`,
    notify: `${address}/events`,
    sessions: `${address}/sessions`
  }

  // exposed for server health check scenario (makes sure the test infra
  // is working as expected)
  process.env.META_NOTIFY = endpoints.notify
  process.env.META_MINIDUMP = endpoints.minidumps

  // build fixture app, logging as it may take a few seconds
  const app = new TestApp(join(__dirname, '../../fixtures/app'))
  console.log('[BeforeAll] Building test app ...')
  await app.packageApp()
  console.log('[BeforeAll] Done!')

  global.automator = new Automator(app, {
    BUGSNAG_API_KEY: '6425093c6530f554a9897d2d7d38e248',
    BUGSNAG_ENDPOINT_MINIDUMPS: endpoints.minidumps,
    BUGSNAG_ENDPOINT_NOTIFY: endpoints.notify,
    BUGSNAG_ENDPOINT_SESSIONS: endpoints.sessions
  })
})

Before(() => {
  global.server.start()
})

After(async ({ result }) => {
  if (result.status === Status.FAILED) {
    global.success = false
  }
  await global.server.stop()
  global.server.clear()
  await global.automator.stop() // start the app fresh every scenario
})

AfterAll(async () => {
  // force kill if the environment doesn't shut down cleanly
  setTimeout(() => process.exit(global.success ? 0 : 1), 500)
  // may hang due to failed tests / disconnected processes
  await global.automator.stop()
})
