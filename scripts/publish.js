const common = require('./common')

function publish(publishUrl) {

  let version = common.determineVersion()
  let distTag = common.getCommitId()
  console.log(`Publishing as: ${version}`)
  console.log(`./node_modules/.bin/lerna publish ${version} --dist-tag ${distTag} --yes --force-publish --no-push --no-git-tag-version --registry ${publishUrl}`)
}

if (process.argv.length !== 3) {
  console.error("Usage: publish.js <registry url>")
  process.exit(1)
}
publish(process.argv[2])
