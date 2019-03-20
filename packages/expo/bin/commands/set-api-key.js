const prompts = require('prompts')
const setApiKey = require('../lib/set-api-key')
const { onCancel } = require('../lib/utils')

module.exports = async () => {
  const response = await prompts({
    type: 'text',
    name: 'apiKey',
    message: 'What is your Bugsnag API key?',
    validate: value => {
      return value.length > 1
        ? true
        : 'API key is required. You can find it by going to\nhttps://app.bugsnag.com/settings/ > Projects'
    }
  }, { onCancel })
  await setApiKey(response.apiKey)
}
