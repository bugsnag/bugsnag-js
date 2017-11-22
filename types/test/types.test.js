const { describe, it, expect } = global

const { spawnSync } = require('child_process')
const { writeFileSync } = require('fs')
const pluginConfig = require('glob')
  .sync(`${__dirname}/../../**/plugins/*.js`)
  .reduce((accum, p) => ({ ...accum, ...require(p).configSchema }), {})
const schema = {
  ...require('../../base/config').schema,
  ...require('../../browser/config').schema,
  ...pluginConfig
}

const exampleValue = (k) => {
  switch (k) {
    case 'apiKey': return 'abc'
    case 'appVersion': return '1.2.3'
    case 'notifyReleaseStages': return []
    default:
      return schema[k].defaultValue()
  }
}

const program = `
import bugsnag from "../../.."
bugsnag({
  ${Object.keys(schema).map((k, i) => `${k}: ${JSON.stringify(exampleValue(k))}`).join(',\n  ')}
})
`.trim()

describe('types', () => {
  it('should compile a typescript program successfully', () => {
    writeFileSync(`${__dirname}/fixtures/app.ts`, program)
    const { stdout } = spawnSync('./node_modules/.bin/tsc', [
      '--strict',
      `${__dirname}/fixtures/app.ts`
    ])
    expect(stdout.toString()).toBe('')
  })
})
