const common = require('./common')

function install(installUrl) {
    let version = common.determineVersion()
    common.run(`npm install @bugsnag/react-native@${version} --registry ${installUrl}`)
}

if (process.argv.length !== 3) {
    console.error("Usage: install.js <registry url>")
    process.exit(1)
}
install(process.argv[2])
