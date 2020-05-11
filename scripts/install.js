const common = require('./common')

function install (installUrl) {
  const version = common.determineVersion()
  const command = `npm install @bugsnag/react-native@${version} --registry ${installUrl}`
  console.info(command)
  common.run(command)
}

if (process.argv.length !== 3) {
  console.error('Usage: install.js <registry url>')
  process.exit(1)
}
install(process.argv[2])
