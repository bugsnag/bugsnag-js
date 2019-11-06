/* global describe, it, expect */

const prepareFixture = require('./lib/prepare-fixture')
const insert = require('../insert')
const { promisify } = require('util')
const { readFile } = require('fs')

describe('expo-cli: insert', () => {
  it('should work on a fresh project', async () => {
    const projectRoot = await prepareFixture('blank-00')
    const msg = await insert(projectRoot)
    expect(msg).toBe(undefined)
    const appJs = await promisify(readFile)(`${projectRoot}/App.js`, 'utf8')
    expect(appJs).toMatch(/^import Bugsnag from '@bugsnag\/expo';\sBugsnag\.init\(\);\s/)
  })

  it('shouldn’t insert if @bugsnag/expo is already imported (import)', async () => {
    const projectRoot = await prepareFixture('already-configured-00')
    const appJsBefore = await promisify(readFile)(`${projectRoot}/app.json`, 'utf8')
    const msg = await insert(projectRoot)
    expect(msg).toMatch(/already/)
    const appJsAfter = await promisify(readFile)(`${projectRoot}/app.json`, 'utf8')
    expect(appJsAfter).toBe(appJsBefore)
  })

  it('shouldn’t insert if @bugsnag/expo is already imported (require)', async () => {
    const projectRoot = await prepareFixture('already-configured-00')
    const appJsBefore = await promisify(readFile)(`${projectRoot}/app.json`, 'utf8')
    const msg = await insert(projectRoot)
    expect(msg).toMatch(/already/)
    const appJsAfter = await promisify(readFile)(`${projectRoot}/app.json`, 'utf8')
    expect(appJsAfter).toBe(appJsBefore)
  })

  it('should provide a reasonable error when there is no App.js', async () => {
    const projectRoot = await prepareFixture('empty-00')
    try {
      await insert(projectRoot)
      expect('should not be here').toBe(false)
    } catch (e) {
      expect(e.message).toMatch(/^Couldn’t find App\.js in/)
    }
  })

  it('doesn’t swallow any other errors', async () => {
    try {
      await insert(/* projectRoot is required */)
      expect('should not be here').toBe(false)
    } catch (e) {
      expect(e.message).toMatch(/The "path" argument must be of type string/)
    }
  })
})
