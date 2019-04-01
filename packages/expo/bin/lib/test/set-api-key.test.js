/* global describe, it, expect */

const prepareFixture = require('./lib/prepare-fixture')
const setApiKey = require('../set-api-key')
const { promisify } = require('util')
const { readFile } = require('fs')

describe('expo-cli: set-api-key', () => {
  it('should work on a fresh project', async () => {
    const projectRoot = await prepareFixture('blank-00')
    const msg = await setApiKey('AABBCCDD', projectRoot)
    expect(msg).toBe(undefined)
    const appJsonRaw = await promisify(readFile)(`${projectRoot}/app.json`, 'utf8')
    const appJson = JSON.parse(appJsonRaw)
    expect(appJson.expo.extra.bugsnag.apiKey).toBe('AABBCCDD')
  })

  it('shouldn’t replaces an existing API key', async () => {
    const projectRoot = await prepareFixture('already-configured-00')
    const msg = await setApiKey('AABBCCDD', projectRoot)
    expect(msg).toBe(undefined)
    const appJsonRaw = await promisify(readFile)(`${projectRoot}/app.json`, 'utf8')
    const appJson = JSON.parse(appJsonRaw)
    expect(appJson.expo.extra.bugsnag.apiKey).toBe('AABBCCDD')
  })

  it('should provide a reasonable error when there is no app.json', async () => {
    const projectRoot = await prepareFixture('empty-00')
    try {
      await setApiKey('AABBCCDD', projectRoot)
      expect('should not be here').toBe(false)
    } catch (e) {
      expect(e.message).toMatch(/^Couldn’t find app\.json in/)
    }
  })

  it('should provide a reasonable error when app.json is not valid JSON', async () => {
    const projectRoot = await prepareFixture('malformed-json-00')
    try {
      await setApiKey('AABBCCDD', projectRoot)
      expect('should not be here').toBe(false)
    } catch (e) {
      expect(e.message).toMatch(/it wasn’t valid JSON/)
    }
  })

  it('doesn’t swallow any other errors', async () => {
    try {
      await setApiKey('AABBCCDD' /* projectRoot is required */)
      expect('should not be here').toBe(false)
    } catch (e) {
      expect(e.message).toMatch(/The "path" argument must be of type string/)
    }
  })
})
