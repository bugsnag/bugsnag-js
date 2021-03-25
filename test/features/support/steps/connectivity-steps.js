const { Given, When } = require('@cucumber/cucumber')

Given('the server is unreachable', async () => {
  await global.server.stop()
})

When('the server becomes reachable', async () => {
  await global.server.start()
})

Given('the app lacks network connectivity', async () => {
  await global.automator.click('emulate-offline')
})

When('the app gains network connectivity', async () => {
  await global.automator.click('emulate-online')
})
