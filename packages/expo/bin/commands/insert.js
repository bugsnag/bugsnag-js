const prompts = require('prompts')
const insert = require('../lib/insert')
const { onCancel } = require('../lib/utils')

module.exports = async (argv, globalOpts) => {
  const res = await prompts({
    type: 'confirm',
    name: 'insert',
    message,
    initial: true
  }, { onCancel })
  if (res.insert) await insert()
}

const message = `The following Bugsnag initialization lines will be added to App.js. Is this ok?
${insert.code}
`
