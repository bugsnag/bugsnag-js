const common = require('./common')

function publish (publishUrl) {
  const version = common.determineVersion()
  const distTag = common.getCommitId()

  // Check for existing published packages
  const allVersions = JSON.parse(common.run(`npm view @bugsnag/js versions --registry ${publishUrl} --json`).toString())
  const myVersions = allVersions.filter(function (str) { return str.indexOf(version) !== -1; })
  if (myVersions.length === 0) {
    console.log(`Publishing as '${version}'`)
    common.run(`./node_modules/.bin/lerna publish ${version} --dist-tag ${distTag} --yes --force-publish --no-push --no-git-tag-version --registry ${publishUrl}`)
  } else {
    console.log(`Version '${version}' already found in registry - skipping publishing`)
  }
}

if (process.argv.length !== 3) {
  console.error('Usage: publish.js <registry url>')
  process.exit(1)
}
publish(process.argv[2])
