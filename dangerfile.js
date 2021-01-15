/* global markdown, schedule */

const { codeCoverage } = require('danger-plugin-code-coverage')
const { istanbulCoverage } = require('danger-plugin-istanbul-coverage')

const path = require('path')
const { readFileSync } = require('fs')

const before = {
  minified: parseInt(readFileSync(`${__dirname}/.size/before-minified`, 'utf8').trim()),
  gzipped: parseInt(readFileSync(`${__dirname}/.size/before-gzipped`, 'utf8').trim())
}

const after = {
  minified: parseInt(readFileSync(`${__dirname}/.size/after-minified`, 'utf8').trim()),
  gzipped: parseInt(readFileSync(`${__dirname}/.size/after-gzipped`, 'utf8').trim())
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
`)

markdown(__dirname)
markdown(`${path.resolve(__dirname, 'coverage/lcov.info')}`)

codeCoverage([{
  title: '# Coverage',
  ignoreCoveragePattern: [],
  coveragePath: path.resolve(__dirname, 'coverage/coverage-final.json')
}])

schedule(istanbulCoverage({
  coveragePath: { path: path.resolve(__dirname, 'coverage/lcov.info'), type: 'lcov' },
  reportFileSet: 'createdOrModified'
}))
