/* eslint-disable jest/no-try-expect */
import { prepareFixture } from './lib/prepare-fixture'
import addHook from '../add-hook'
import { promisify } from 'util'
import { readFile } from 'fs'

describe('expo-cli: add-hook', () => {
  it('should work on a fresh project', async () => {
    const { target: projectRoot, clean } = await prepareFixture('blank-00')
    const msg = await addHook(projectRoot)
    expect(msg).toBe(undefined)
    const appJsonRaw = await promisify(readFile)(`${projectRoot}/app.json`, 'utf8')
    const appJson = JSON.parse(appJsonRaw)
    expect(appJson.expo.hooks.postPublish[0].file).toBe('@bugsnag/expo/hooks/post-publish.js')
    await clean()
  })

  it('shouldn’t duplicate the hook config', async () => {
    const { target: projectRoot, clean } = await prepareFixture('already-configured-00')
    const msg = await addHook(projectRoot)
    expect(msg).toMatch(/already/)
    const appJsonRaw = await promisify(readFile)(`${projectRoot}/app.json`, 'utf8')
    const appJson = JSON.parse(appJsonRaw)
    expect(appJson.expo.hooks.postPublish.length).toBe(1)
    await clean()
  })

  it('should provide a reasonable error when there is no app.json', async () => {
    const { target: projectRoot, clean } = await prepareFixture('empty-00')
    try {
      await addHook(projectRoot)
      expect('should not be here').toBe(false)
    } catch (e) {
      expect((e as Error).message).toMatch(/^Couldn’t find app\.json in/)
      await clean()
    }
  })

  it('should provide a reasonable error when app.json is not valid JSON', async () => {
    const { target: projectRoot, clean } = await prepareFixture('malformed-json-00')
    try {
      await addHook(projectRoot)
      expect('should not be here').toBe(false)
    } catch (e) {
      expect((e as Error).message).toMatch(/it wasn’t valid JSON/)
      await clean()
    }
  })

  it('doesn’t swallow any other errors', async () => {
    try {
      await addHook(/* projectRoot is required */)
      expect('should not be here').toBe(false)
    } catch (e) {
      expect((e as Error).message).toMatch(/The "path" argument must be of type string/)
    }
  })
})
