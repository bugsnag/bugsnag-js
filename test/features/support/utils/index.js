const { readFile } = require('fs').promises
const { join } = require('path')

const fixturePath = (name) => join(__dirname, `../../../fixtures/events/${name}`)

const readFixtureFile = async (fixture) => {
  // FUTURE: we could substitute instances of `{platform}` with process.platform
  // from fixture to support platform-specific fixture files
  const expected = JSON.parse(await readFile(fixturePath(fixture)))

  // TODO: Load current notifier version from root package.json and replace any
  // instances of `expected.notifier.version` with it
  delete expected.notifier

  return expected
}

module.exports = { fixturePath, readFixtureFile }
