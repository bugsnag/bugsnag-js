/* global describe, it, expect */

const prepareFixture = require('./lib/prepare-fixture')
const detectInstalled = require('../detect-installed')

describe('expo-cli: detect-installed', () => {
  it('should work on a fresh project', async () => {
    const projectRoot = await prepareFixture('blank-00')
    const version = await detectInstalled(projectRoot)
    expect(version).toBe(undefined)
  })

  it('should work on project with Bugsnag installed', async () => {
    const projectRoot = await prepareFixture('already-configured-00')
    const version = await detectInstalled(projectRoot)
    expect(version).toBe('^7.0.0')

    const projectRoot2 = await prepareFixture('already-configured-01')
    const version2 = await detectInstalled(projectRoot2)
    expect(version2).toBe('7.0.0')
  })
})
