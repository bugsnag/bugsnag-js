const lerna = require('../lerna.json')
const { execSync } = require('child_process')

module.exports = {
  run: function run (command, toStdout = false) {
    console.log(command)
    if (toStdout) {
      execSync(command, { stdio: 'inherit' })
    } else {
      return execSync(command).toString().trim()
    }
  },
  changeDir (into) {
    console.log(`Changing into directory: ${into}`)
    process.chdir(into)
  },
  getCommitId: function getCommitId () {
    return this.run('git rev-parse --short=10 HEAD')
  },
  determineVersion: function determineVersion () {
    // Form version string - branch name and commit id
    const commitId = this.getCommitId()
    const regex = /[^(a-zA-Z0-9.\-)]/g
    let branchName
    if (process.env.BRANCH_NAME) {
      console.log('Using BRANCH_NAME from the environment')
      branchName = process.env.BRANCH_NAME.replace(regex, '-')
    } else {
      console.log('Using local Git repo to determine branch name (environment BRANCH_NAME may also be used)')
      branchName = this.run('git rev-parse --abbrev-ref HEAD').replace(regex, '-')
    }

    // Get the current version from lerna.json
    const lernaVersion = lerna.version.match(/^[1-9][0-9]*\.[0-9]+\.[0-9]+/)[0]

    // Distinguish from local use
    const ciIndicator = (process.env.BUILDKITE ? 'ci-' : '')

    return `${lernaVersion}-${ciIndicator}${branchName}.${commitId}`
  }
}
