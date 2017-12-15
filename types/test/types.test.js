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

describe('types', () => {
  it('should compile a typescript program successfully', () => {
    const program = `
import bugsnag from "../../.."
bugsnag({
  ${Object.keys(schema).map((k, i) => `${k}: ${JSON.stringify(exampleValue(k))}`).join(',\n  ')}
}, [ { init: () => {} }])
`.trim()
    writeFileSync(`${__dirname}/fixtures/app.ts`, program)
    const { stdout } = spawnSync('./node_modules/.bin/tsc', [
      '--strict',
      `${__dirname}/fixtures/app.ts`
    ])
    expect(stdout.toString()).toBe('')
  })

  it('should have access to all public types', () => {
    const program = `
import { Bugsnag } from "../../..";
let bugsnagInstance: Bugsnag.Client | undefined = undefined;
export function notify(error: Bugsnag.NotifiableError, opts?: Bugsnag.INotifyOpts): boolean {
  if (bugsnagInstance === undefined) {
    return false
  }
  return bugsnagInstance.notify(error, opts)
}
`.trim()
    writeFileSync(`${__dirname}/fixtures/app.ts`, program)
    const { stdout } = spawnSync('./node_modules/.bin/tsc', [
      '--strict',
      `${__dirname}/fixtures/app.ts`
    ])
    expect(stdout.toString()).toBe('')
  })
})
