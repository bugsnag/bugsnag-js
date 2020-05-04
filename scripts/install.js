const common = require('./common')

function install(installUrl) {

    let versionBase = common.determineBaseVersion()

}

if (process.argv.length !== 3) {
    console.error("Usage: install.js <registry url>")
    process.exit(1)
}
install(process.argv[2])
