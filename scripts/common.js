const { execSync } = require("child_process");

module.exports = {
    run: function run(command) {
        return execSync(command).toString().trim()
    },

    determineBaseVersion: function determineBaseVersion() {
        /*
         * Form version string: Include branch name and commit id to avoid most clashes.  Also include the year
         * and month in the version to publish to make it easier to clear out our private NPM repository occasionally.
         */
        let commitId = this.run('git rev-parse --short HEAD')
        let branchName;
        if (process.env.BRANCH_NAME) {
            console.log('Using BRANCH_NAME from the environment')
            branchName = process.env.BRANCH_NAME
        } else {
            console.log('Using local Git repo to determine branch name')
            branchName = this.run('git branch --show-current')
        }

        let d = new Date()
        let month = d.getFullYear().toString().substr(-2) + '-' + (d.getMonth() + 1).toString().padStart(2, '0')
        return `0.0.0-ci-${month}-${branchName}-${commitId}`
    }
}
