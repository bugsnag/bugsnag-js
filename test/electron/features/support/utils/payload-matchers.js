const { red, green } = require('chalk')

/* Sentinel value to match any defined value */
const anyMatcher = '{ANY}'
const regexMatcher = /^{REGEX:(.*)}$/
const typeMatcher = /^{TYPE:(.*)}$/
const timestampMatcher = /^{TIMESTAMP}$/
const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
const platformMatcher = /PLATFORM_(?<platform>MACOS|LINUX|WINDOWS):(?<expected>[^|}]+)/g

const platforms = {
  darwin: 'MACOS',
  win32: 'WINDOWS',
  linux: 'LINUX'
}

const currentPlatform = platforms[process.platform] || process.platform

/* Assert value is a string and matches a regular expression */
const compareRegex = (pattern, actual, path) => {
  if (typeof actual !== 'string' || !actual.match(pattern)) {
    return [{ path, expected: pattern, actual, message: 'Expected to match pattern' }]
  }
  return []
}

/* Assert value matches a literal expected value */
const compareExact = (expected, actual, path) => {
  if (actual !== expected) {
    return [{ path, expected, actual, message: 'Expected an exact match' }]
  }
  return []
}

/* Assert value is an expected type */
const compareType = (expected, actual, path) => {
  // eslint-disable-next-line valid-typeof
  if (typeof actual !== expected) {
    return [{ path, expected, actual, message: `Expected an item of '${expected}' type` }]
  }
  return []
}

/* Assert value contains a match for every expected key */
const compareObject = (expected, actual, path) => {
  if (typeof actual !== 'object' || Array.isArray(actual) || actual === null) {
    return [{ path, expected, actual, message: 'Expected a (non-array) object' }]
  }
  return Object.keys(expected).flatMap(key => {
    return compare(expected[key], actual[key], [path, key].join('.'))
  })
}

/* Assert value contains ordered matches for every item in an array of expected
 * values
 */
const compareArray = (expected, actual, path) => {
  if (!Array.isArray(actual)) {
    return [{ path, expected, actual, message: `Expected an array, received ${typeof actual}` }]
  }
  let found = 0 // counts matching indices and ensures ordering is correct
  const expectToFind = expected.length
  const keyPath = [path, '{index}'].join('.')
  let differences
  for (const item of actual) {
    if (found === expectToFind) {
      break
    }
    differences = compare(expected[found], item, [path, found].join('.'))
    if (differences.length === 0) {
      found++
    }
  }

  if (found === expectToFind) {
    return []
  }
  if (expectToFind === 1 && differences.length > 0) {
    // Added a special case when looking for an array of 1 to show the diffs
    // with the existing output. This should make cases like top-level `events`
    // and `sessions` more reasonable.
    return differences
  }

  const missing = expected.slice(found)
  return [{
    actual,
    path: keyPath,
    expected: missing,
    message: 'Missing expected array entries'
  }]
}

/* Assert some variety of value matches an expected thing (of some variety) */
const compare = (expected, actual, path = '') => {
  // Ensure there's an actual value unless this is a platform specific matcher
  // or the expected value is "undefined". Some platforms may not have values
  // for fields that are specific to other platforms
  if (typeof actual === 'undefined' && !expected.match(platformMatcher) && expected !== '{TYPE:undefined}') {
    return [{ path, expected, actual, message: 'Expected a value but was undefined' }]
  }
  switch (typeof expected) {
    case 'object': {
      if (expected === null) {
        return compareExact(expected, actual, path)
      }
      const comparator = Array.isArray(expected) ? compareArray : compareObject
      return comparator(expected, actual, path)
    }
    case 'number':
    case 'boolean':
      return compareExact(expected, actual, path)
    case 'string':
      if (expected === anyMatcher) {
        return [] // handled by checking if actual is defined at the beginning
      } else if (expected.match(typeMatcher)) {
        const type = expected.match(typeMatcher)[1]
        return compareType(type, actual, path)
      } else if (expected.match(timestampMatcher)) {
        return compareRegex(timestampPattern, actual, path)
      } else if (expected.match(regexMatcher)) {
        const pattern = expected.match(regexMatcher)[1]
        return compareRegex(pattern, actual, path)
      } else if (expected.match(platformMatcher)) {
        const matches = Array.from(expected.matchAll(platformMatcher))
        const groups = matches.map(match => match.groups)
        const platformToExpected = new Map(groups.map(group => [group.platform, group.expected]))
        const platformSpecificExpected = platformToExpected.get(currentPlatform)

        if (platformSpecificExpected === undefined) {
          if (actual === undefined) {
            return []
          }

          return [{ path, expected, actual, message: `Expected no value for ${currentPlatform}` }]
        }

        return compare(platformSpecificExpected, actual, path)
      } else {
        return compareExact(expected, actual, path)
      }
    default:
      throw new Error(`How'd you manage to get ${typeof expected} in a JSON file?`)
  }
}

module.exports = {
  toContainPayload (payloads, expected, matchOptions = {}) {
    const { allowMultipleMatches = false } = matchOptions
    const results = payloads.map(actual => compare(expected, actual))
    // make the nearest match (least differences) be at the head of the array
    results.sort((a, b) => a.length - b.length)

    const exactMatches = results.filter(r => r.length === 0)
    if (exactMatches.length === 1 || (exactMatches.length === payloads.length && allowMultipleMatches)) {
      return {
        message: () => 'Expected no payloads to match but one did',
        pass: true
      }
    } else if (exactMatches.length > 1) {
      return {
        message: () => `Received ${exactMatches.length} matching payloads`,
        pass: false
      }
    } else {
      const options = { isNot: this.isNot, promise: this.promise, isDirectExpectCall: true }
      // Pretty-print objects as JSON
      const format = (val) => typeof val === 'object' ? JSON.stringify(val, null, 2) : val
      const summarize = () => {
        return results[0].map(diff => {
          return `  ${diff.path}: ${diff.message}\n` +
            `    Expected: ${green(format(diff.expected))}\n` +
            `    Received: ${red(format(diff.actual))}\n`
        }).join('\n')
      }
      const nearestInfo = results.length > 0
        ? ` - Nearest match (of ${results.length}):\n${summarize()}`
        : ' - No payloads received'
      return {
        message: () =>
          this.utils.matcherHint('toContainPayload', undefined, undefined, options) +
          nearestInfo,
        pass: false
      }
    }
  }
}
