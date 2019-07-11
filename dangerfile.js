/* global markdown */

const { readFileSync } = require('fs')

const before = {
  minified: parseInt(readFileSync(`${__dirname}/.size/before-minified`, 'utf8').trim()),
  gzipped: parseInt(readFileSync(`${__dirname}/.size/before-gzipped`, 'utf8').trim())
}

const after = {
  minified: parseInt(readFileSync(`${__dirname}/.size/after-minified`, 'utf8').trim()),
  gzipped: parseInt(readFileSync(`${__dirname}/.size/after-gzipped`, 'utf8').trim())
}

const formatKbs = (n) => (n / 1000).toFixed(2)

const diffMinSize = before.minified - after.minified
const diffZipSize = before.gzipped - after.gzipped
const showDiff = n => {
  if (n > 0) return `⚠️ +${n} bytes ⬆️`
  if (n < 0) return `-${n} bytes ⬇️`
  return 'No change'
}

markdown(`
### \`@bugsnag/browser\` bundle size diff

|        | Minified                      | Minfied + Gzipped            |
|--------|-------------------------------|------------------------------|
| Before | ${formatKbs(before.minified)} | ${formatKbs(before.gzipped)} |
| After  | ${formatKbs(after.minified)}  | ${formatKbs(after.gzipped)}  |
| ±      | ${showDiff(diffMinSize)}      | ${showDiff(diffZipSize)}     |
`)
