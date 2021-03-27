const { join } = require('path')
const { mkdir } = require('fs').promises
const { After, AfterAll, Before, BeforeAll, Status } = require('@cucumber/cucumber')
const { MockServer } = require('./server')
const { TestApp } = require('./app')
const { Automator } = require('./automator')
const { publishPackages, startServer } = require('./repo')

const failureOutputDir = join(__dirname, '../../../.cucumber-failures')

// Allow a longer timeout for this step, which packages the app to run the tests
// The upper bound for timeouts is only really an issue on lower-resourced
// containers, and should otherwise complete in a few seconds.
BeforeAll({ timeout: 240 * 1000 }, async () => {
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

  if (process.env.START_LOCAL_NPM) {
    console.log('[BeforeAll] Launching local NPM server ...')
    global.local_npm = startServer()
  }

  // App used for test automation
  const app = new TestApp(join(__dirname, '../../fixtures/app'))

  // package and install @bugsnag/electron
  if (!process.env.SKIP_INSTALL) {
    console.log('[BeforeAll] Packaging packages ...')
    const packageVersion = await publishPackages()
    console.log('[BeforeAll] Installing dependencies ...')
    await app.installDeps(packageVersion, process.env.ELECTRON_VERSION)
  }

  // build fixture app, logging as it may take a few seconds
  if (!process.env.SKIP_PACKAGE_APP) {
    console.log('[BeforeAll] Building test app ...')
    await app.packageApp({
      BUGSNAG_API_KEY: '6425093c6530f554a9897d2d7d38e248',
      BUGSNAG_ENDPOINT_MINIDUMPS: endpoints.minidumps,
      BUGSNAG_ENDPOINT_NOTIFY: endpoints.notify,
      BUGSNAG_ENDPOINT_SESSIONS: endpoints.sessions
    })
    console.log('[BeforeAll] Done!')
  }

  global.automator = new Automator(app)
})

Before(() => {
  global.server.start()
})

// allow a few seconds to terminate the app, including retries
After({ timeout: 15_000 }, async ({ result, pickle }) => {
  await global.server.stop()
  if (result.status === Status.FAILED) {
    global.success = false
    const time = Math.floor(new Date().getTime() / 1000)
    const output = join(failureOutputDir, `${pickle.name}-${time}`)
    await mkdir(output, { recursive: true })
    await global.server.writeUploadsTo(output)
  }
  await global.automator.stop() // start the app fresh every scenario
  global.server.clear()
})

AfterAll(async () => {
  if (global.local_npm) {
    global.local_npm.kill()
  }
  // force kill if the environment doesn't shut down cleanly
  setTimeout(() => process.exit(global.success ? 0 : 1), 500)
  // may hang due to failed tests / disconnected processes
  await global.automator.stop()
})
