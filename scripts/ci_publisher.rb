require 'date'
require 'json'

puts BRANCH_NAME = ARGV[0]
puts PUBLISH_URL = ARGV[1]
COMMIT_ID = `git rev-parse --short HEAD`.strip

# Encode branch name and commit id in the version pre-id to avoid most clashes.
# Also encode the year and month in the version to publish to make it easier to
# clear out our private NPM repository occasionally.
MONTH = DateTime.now.strftime "%y-%m"
version_base = "0.0.0-ci-#{MONTH}-#{BRANCH_NAME}-#{COMMIT_ID}"

# Find any existing pre-releases for the branch/commit combination - to be sure
# we never collide.
versions = JSON.parse(`npm view @bugsnag/js versions --registry ${PUBLISH_URL} --json`)
puts "@bugsnag/js has a total of #{versions.length} versions in NPM"
versions.select! { |i| i.start_with?(version_base) }
puts "Of those, #{versions.length} match our version base: #{version_base}"
preid = -1
# Find the highest existing pre-release identifier
versions.each do |i| i
  id = i[version_base.length + 1 .. -1].to_i
  preid = id if id > preid
end
preid += 1
puts "Publishing as: #{version_base}.#{preid}"

# Finally, publish
`./node_modules/.bin/lerna publish #{version_base}.#{preid} --yes --force-publish --no-push --no-git-tag-version --registry ${PUBLISH_URL}`
