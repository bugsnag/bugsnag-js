const common = require('./common')

function publish(publishUrl) {

  let versionBase = common.determineBaseVersion()

  // Find any existing pre-releases for the branch/commit combination - to be sure we never collide.
  let versions = JSON.parse(common.run(`npm view @bugsnag/js versions --registry ${publishUrl} --json`))
  console.log(`@bugsnag/js has a total of ${versions.length} versions in NPM`)

  versions = versions.filter(function (str) { return str.indexOf(versionBase) !== -1; })
  console.log(`Of those, ${versions.length} match our version base: ${versionBase}`)

  // Find the highest existing pre-release identifier
  let preId = -1
  versions.forEach(function(version) {
    let id = parseInt(version.toString().substring(versionBase.length + 1))
    if (id > preId) preId = id
  })

  // Finally, publish
  preId += 1
  let fullVersion = `${versionBase}.${preId}`
  console.log(`Publishing as: ${fullVersion}`)
  console.log(`./node_modules/.bin/lerna publish ${fullVersion} --yes --force-publish --no-push --no-git-tag-version --registry ${publishUrl}`)
}

publish(process.argv[2])
