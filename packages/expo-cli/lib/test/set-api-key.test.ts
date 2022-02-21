/* eslint-disable jest/no-try-expect */
import { prepareFixture } from './lib/prepare-fixture'
import setApiKey from '../set-api-key'
import { promisify } from 'util'
import { readFile } from 'fs'

describe('expo-cli: set-api-key', () => {
  it('should work on a fresh project', async () => {
    const { target: projectRoot, clean } = await prepareFixture('blank-00')
    const msg = await setApiKey('AABBCCDD', projectRoot)
    expect(msg).toBe(undefined)
    const appJsonRaw = await promisify(readFile)(`${projectRoot}/app.json`, 'utf8')
    const appJson = JSON.parse(appJsonRaw)
    expect(appJson.expo.extra.bugsnag.apiKey).toBe('AABBCCDD')
    await clean()
  })

  it('shouldn’t replaces an existing API key', async () => {
    const { target: projectRoot, clean } = await prepareFixture('already-configured-00')
    const msg = await setApiKey('AABBCCDD', projectRoot)
    expect(msg).toBe(undefined)
    const appJsonRaw = await promisify(readFile)(`${projectRoot}/app.json`, 'utf8')
    const appJson = JSON.parse(appJsonRaw)
    expect(appJson.expo.extra.bugsnag.apiKey).toBe('AABBCCDD')
    await clean()
  })

  it('should provide a reasonable error when there is no app.json', async () => {
    const { target: projectRoot, clean } = await prepareFixture('empty-00')
    try {
      await setApiKey('AABBCCDD', projectRoot)
      expect('should not be here').toBe(false)
    } catch (e) {
      expect((e as Error).message).toMatch(/^Couldn’t find app\.json in/)
      await clean()
    }
  })

  it('should provide a reasonable error when app.json is not valid JSON', async () => {
    const { target: projectRoot, clean } = await prepareFixture('malformed-json-00')
    try {
      await setApiKey('AABBCCDD', projectRoot)
      expect('should not be here').toBe(false)
    } catch (e) {
      expect((e as Error).message).toMatch(/it wasn’t valid JSON/)
      await clean()
    }
  })

  it('doesn’t swallow any other errors', async () => {
    try {
      await setApiKey('AABBCCDD' /* projectRoot is required */)
      expect('should not be here').toBe(false)
    } catch (e) {
      expect((e as Error).message).toMatch(/The "path" argument must be of type string/)
    }
  })
})
