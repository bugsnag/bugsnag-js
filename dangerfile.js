/* global markdown */

const { readFileSync } = require('fs')
const coverageDiff = require('coverage-diff')

const before = {
  minified: parseInt(readFileSync(`${__dirname}/.diff/size-before-minified`, 'utf8').trim()),
  gzipped: parseInt(readFileSync(`${__dirname}/.diff/size-before-gzipped`, 'utf8').trim()),
  coverage: JSON.parse(readFileSync(`${__dirname}/.diff/coverage-before.json`, 'utf8'))
}

const after = {
  minified: parseInt(readFileSync(`${__dirname}/.diff/size-after-minified`, 'utf8').trim()),
  gzipped: parseInt(readFileSync(`${__dirname}/.diff/size-after-gzipped`, 'utf8').trim()),
  coverage: JSON.parse(readFileSync(`${__dirname}/.diff/coverage-after.json`, 'utf8'))
}

const formatKbs = (n) => `${(n / 1000).toFixed(2)} kB`

const diffMinSize = after.minified - before.minified
const diffZipSize = after.gzipped - before.gzipped
const showDiff = n => {
  if (n > 0) return `⚠️ \`+${n.toLocaleString()} bytes\``
  if (n < 0) return `\`${n.toLocaleString()} bytes\``
  return '_No change_'
}

markdown(`
### \`@bugsnag/browser\` bundle size diff

|        | Minified                      | Minfied + Gzipped                    |
|--------|-------------------------------|--------------------------------------|
| Before | \`${formatKbs(before.minified)}\` | \`${formatKbs(before.gzipped)}\` |
| After  | \`${formatKbs(after.minified)}\`  | \`${formatKbs(after.gzipped)}\`  |
| ±      | ${showDiff(diffMinSize)}          | ${showDiff(diffZipSize)}         |

### code coverage diff

${coverageDiff.diff(before.coverage, after.coverage).results}
`)
