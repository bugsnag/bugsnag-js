const { execSync } = require("child_process");

function publish(publishUrl, branchName) {

  /*
   * Include branch name and commit id in the version pre-id to avoid most clashes.  Also include the year
   * and month in the version to publish to make it easier to clear out our private NPM repository occasionally.
   */
  let commitId = execSync('git rev-parse --short HEAD').toString().trim()

  // TODO Remove this
  commitId = "3e8fcab4"

  let d = new Date()
  let month = d.getFullYear().toString().substr(-2) + '-' + (d.getMonth() + 1).toString().padStart(2, '0')
  let versionBase = `0.0.0-ci-${month}-${branchName}-${commitId}`

  // Find any existing pre-releases for the branch/commit combination - to be sure we never collide.
  let versions = JSON.parse(execSync(`npm view @bugsnag/js versions --registry ${publishUrl} --json`).toString())
  console.log(`@bugsnag/js has a total of ${versions.length} versions in NPM`)

  versions = versions.filter(function (str) { return str.indexOf(versionBase) !== -1; })
  console.log(`Of those, ${versions.length} match our version base: ${versionBase}`)

  // Find the highest existing pre-release identifier
  let preId = -1
  versions.forEach(function(version) {
    let id = parseInt(version.toString().substring(versionBase.length + 1))
    if (id > preId) preId = id;
  });

  // Finally, publish
  preId += 1
  let fullVersion = `${versionBase}.${preId}`
  console.log(`Publishing as: ${fullVersion}`)
  console.log(`./node_modules/.bin/lerna publish ${fullVersion} --yes --force-publish --no-push --no-git-tag-version --registry ${publishUrl}`)
}

publish(process.argv[2], "skwtest")
