const { describe, it, expect } = global

const { spawnSync } = require('child_process')
const { writeFileSync } = require('fs')
const plugins = require('glob').sync(`${__dirname}/../../node_modules/@bugsnag/plugin-*`)
const schema = {
  ...require('@bugsnag/core/config').schema,
  ...require('../../src/config').schema,
  ...plugins.reduce((accum, pl) => ({ ...accum, ...require(pl).configSchema }), {})
}

const exampleValue = (k) => {
  switch (k) {
    case 'apiKey': return 'abc'
    case 'appVersion': return '1.2.3'
    case 'appType': return 'worker'
    case 'notifyReleaseStages': return []
    case 'filters': return [ 'foo', new RegExp('bar') ]
    default:
      return schema[k].defaultValue(null, {})
  }
}

const replacer = (key, value) => {
  if (value instanceof RegExp) return `__REGEX_${value.toString()}_REGEX__`
  return value
}

const regexRehydrator = json => json ? json.replace(/"__REGEX_(.*)_REGEX__"/, '$1') : json

describe('types', () => {
  it('should compile a typescript program successfully', () => {
    const opts = Object.keys(schema).map((k, i) =>
      `${k}: ${regexRehydrator(JSON.stringify(exampleValue(k), replacer))}`
    )
    const program = `
import bugsnag from "../../.."
bugsnag({
  ${opts.join(',\n  ')}
})
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
export function notify(error: Bugsnag.NotifiableError, opts?: Bugsnag.INotifyOpts): void {
  if (bugsnagInstance === undefined) {
    return
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

  it('should work with breadcrumbs', () => {
    const program = `
import bugsnag from "../../..";
const bugsnagClient = bugsnag({
  apiKey: 'api_key',
  beforeSend: (report) => {
    report.breadcrumbs.map(breadcrumb => {
      console.log(breadcrumb.type)
      console.log(breadcrumb.name)
      console.log(breadcrumb.metaData)
      console.log(breadcrumb.timestamp)
    })
  }
});
`.trim()
    writeFileSync(`${__dirname}/fixtures/app.ts`, program)
    const { stdout } = spawnSync('./node_modules/.bin/tsc', [
      '--strict',
      `${__dirname}/fixtures/app.ts`
    ])
    expect(stdout.toString()).toBe('')
  })

  it('should work with plugins', () => {
    const program = `
import bugsnag from "../../..";
const bugsnagClient = bugsnag('api_key');
bugsnagClient.use({
  name: 'foobar',
  init: client => 10
})
console.log(bugsnagClient.getPlugin('foo') === 10)
`.trim()
    writeFileSync(`${__dirname}/fixtures/app.ts`, program)
    const { stdout } = spawnSync('./node_modules/.bin/tsc', [
      '--strict',
      `${__dirname}/fixtures/app.ts`
    ])
    expect(stdout.toString()).toBe('')
  })
})
