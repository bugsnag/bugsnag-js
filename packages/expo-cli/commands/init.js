const install = require('./install')
const setApiKey = require('./set-api-key')
const insert = require('./insert')
const addHook = require('./add-hook')

module.exports = async (argv, globalOpts) => {
  await install(argv, globalOpts)
  await setApiKey(argv, globalOpts)
  await insert(argv, globalOpts)
  await addHook(argv, globalOpts)
}
