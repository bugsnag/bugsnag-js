const prompts = require('prompts')
const addHook = require('../lib/add-hook')
const { onCancel } = require('../lib/utils')
const { blue, yellow } = require('kleur')

module.exports = async (argv, globalOpts) => {
  const res = await prompts({
    type: 'confirm',
    name: 'addHook',
    message: `This will modify your app.json. Is that ok?`,
    initial: true
  }, { onCancel })
  if (res.addHook) {
    console.log(blue(`> Inserting hook config into app.json`))
    const msg = await addHook(globalOpts['project-root'])
    if (msg) console.log(yellow(`  ${msg}`))
  }
}
