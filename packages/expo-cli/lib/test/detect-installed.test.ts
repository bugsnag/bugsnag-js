import { prepareFixture } from './lib/prepare-fixture'
import detectInstalled from '../detect-installed'

describe('expo-cli: detect-installed', () => {
  it('should work on a fresh project', async () => {
    const { target: projectRoot, clean } = await prepareFixture('blank-00')
    const version = await detectInstalled(projectRoot)
    expect(version).toBe(undefined)
    await clean()
  })

  it('should work on project with Bugsnag installed', async () => {
    const { target: projectRoot, clean } = await prepareFixture('already-configured-00')
    const version = await detectInstalled(projectRoot)
    expect(version).toBe('^7.0.0')
    await clean()

    const { target: projectRoot2, clean: clean2 } = await prepareFixture('already-configured-01')
    const version2 = await detectInstalled(projectRoot2)
    expect(version2).toBe('7.0.0')
    await clean2()
  })
})
