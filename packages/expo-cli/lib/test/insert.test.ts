import { prepareFixture } from './lib/prepare-fixture'
import insert from '../insert'
import { promisify } from 'util'
import { readFile } from 'fs'

describe('expo-cli: insert', () => {
  it('should work on a fresh project', async () => {
    const { target: projectRoot, clean } = await prepareFixture('blank-00')
    const msg = await insert(projectRoot)
    expect(msg).toBe(undefined)
    const appJs = await promisify(readFile)(`${projectRoot}/App.js`, 'utf8')
    expect(appJs).toMatch(/^import Bugsnag from '@bugsnag\/expo';\sBugsnag.start\(\);\s/)
    await clean()
  })

  it('shouldn’t insert if @bugsnag/expo is already imported (import)', async () => {
    const { target: projectRoot, clean } = await prepareFixture('already-configured-00')
    const appJsBefore = await promisify(readFile)(`${projectRoot}/app.json`, 'utf8')
    const msg = await insert(projectRoot)
    expect(msg).toMatch(/already/)
    const appJsAfter = await promisify(readFile)(`${projectRoot}/app.json`, 'utf8')
    expect(appJsAfter).toBe(appJsBefore)
    await clean()
  })

  it('shouldn’t insert if @bugsnag/expo is already imported (require)', async () => {
    const { target: projectRoot, clean } = await prepareFixture('already-configured-00')
    const appJsBefore = await promisify(readFile)(`${projectRoot}/app.json`, 'utf8')
    const msg = await insert(projectRoot)
    expect(msg).toMatch(/already/)
    const appJsAfter = await promisify(readFile)(`${projectRoot}/app.json`, 'utf8')
    expect(appJsAfter).toBe(appJsBefore)
    await clean()
  })

  it('should provide a reasonable error when there is no App.js', async () => {
    const { target: projectRoot, clean } = await prepareFixture('empty-00')
    await expect(insert(projectRoot)).rejects.toThrow(/^Couldn’t find App\.js in/)
    await clean()
  })

  it('doesn’t swallow any other errors', async () => {
    await expect(insert(/* projectRoot is required */)).rejects.toThrow(/The "path" argument must be of type string/)
  })

  it('inserts correct code for pre v7 versions of Bugsnag', async () => {
    const { target: projectRoot, clean } = await prepareFixture('already-installed-00')
    const msg = await insert(projectRoot)
    expect(msg).toBe(undefined)
    const appJs = await promisify(readFile)(`${projectRoot}/App.js`, 'utf8')
    expect(appJs).toMatch(/^import bugsnag from '@bugsnag\/expo';\sconst bugsnagClient = bugsnag\(\);\s/)
    await clean()
  })

  it('inserts correct code for post v7.0.0 versions of Bugsnag', async () => {
    const { target: projectRoot, clean } = await prepareFixture('already-installed-01')
    const msg = await insert(projectRoot)
    expect(msg).toBe(undefined)
    const appJs = await promisify(readFile)(`${projectRoot}/App.js`, 'utf8')
    expect(appJs).toMatch(/^import Bugsnag from '@bugsnag\/expo';\sBugsnag\.start\(\);\s/)
    await clean()
  })
})
