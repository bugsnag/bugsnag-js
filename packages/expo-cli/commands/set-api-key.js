const prompts = require('prompts')
const setApiKey = require('../lib/set-api-key')
const { onCancel } = require('../lib/utils')
const { blue, yellow } = require('kleur')

module.exports = async (argv, globalOpts) => {
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
  console.log(blue('> Inserting API key into app.json'))
  const msg = await setApiKey(response.apiKey, globalOpts['project-root'])
  if (msg) console.log(yellow(`  ${msg}`))
}
