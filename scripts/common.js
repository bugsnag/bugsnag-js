const { execSync } = require("child_process");

module.exports = {
    run: function run(command) {
        return execSync(command).toString().trim()
    },
    getCommitId: function getCommitId() {
        return this.run('git rev-parse --short HEAD');
    },
    determineVersion: function determineVersion() {
        // Form version string - branch name and commit id
        let commitId = this.getCommitId();
        let branchName;
        if (process.env.BRANCH_NAME) {
            console.log('Using BRANCH_NAME from the environment')
            branchName = process.env.BRANCH_NAME
        } else {
            console.log('Using local Git repo to determine branch name (environment BRANCH_NAME may also be used)')
            branchName = this.run('git branch --show-current').replace(/\//g,"-")
        }

        // Get the current version from lerna.json
        const lerna = require("../lerna.json");
        let lernaVersion = lerna.version.match(/^[1-9][0-9]*\.[0-9]+\.[0-9]+/)[0];

        return `${lernaVersion}-${branchName}.${commitId}`
    }
}
