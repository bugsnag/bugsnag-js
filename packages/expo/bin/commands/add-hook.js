const prompts = require('prompts')
const addHook = require('../lib/add-hook')
const { onCancel } = require('../lib/utils')

module.exports = async (argv, globalOpts) => {
  const res = await prompts({
    type: 'confirm',
    name: 'addHook',
    message: `This will modify your app.json. Is that ok?`,
    initial: true
  }, { onCancel })
  if (res.addHook) await addHook()
}
