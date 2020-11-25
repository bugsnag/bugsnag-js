import { addApiKey } from '../AndroidManifest'
import logger from '../../Logger'
import path from 'path'
import { promises as fs } from 'fs'

async function loadFixture (fixture: string) {
  return jest.requireActual('fs').promises.readFile(fixture, 'utf8')
}

async function generateNotFoundError () {
  try {
    await jest.requireActual('fs').promises.readFile(path.join(__dirname, 'does-not-exist.txt'))
  } catch (e) {
    return e
  }
}

jest.mock('../../Logger')
jest.mock('fs', () => {
  return { promises: { readFile: jest.fn(), writeFile: jest.fn() } }
})

afterEach(() => jest.resetAllMocks())

test('addApiKey(): success', async () => {
  const androidManifest = await loadFixture(path.join(__dirname, 'fixtures', 'AndroidManifest-before.xml'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(androidManifest)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()

  await addApiKey('/random/path', 'API_KEY_GOES_HERE', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/src/main/AndroidManifest.xml', 'utf8')
  expect(writeFileMock).toHaveBeenCalledWith(
    '/random/path/android/app/src/main/AndroidManifest.xml',
    await loadFixture(path.join(__dirname, 'fixtures', 'AndroidManifest-after.xml')),
    'utf8'
  )
})

test('addApiKey(): already present', async () => {
  const androidManifest = await loadFixture(path.join(__dirname, 'fixtures', 'AndroidManifest-after.xml'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(androidManifest)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()

  await addApiKey('/random/path', 'API_KEY_GOES_HERE', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/src/main/AndroidManifest.xml', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toHaveBeenCalledWith('API key is already present, skipping')
})

test('addApiKey(): self closing application tag', async () => {
  const androidManifest =
`<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.bugsnagreactnativeclitest">
  <application/>
</manifest>`

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(androidManifest)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  await addApiKey('/random/path', 'API_KEY_GOES_HERE', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/src/main/AndroidManifest.xml', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toHaveBeenCalledWith(
    expect.stringContaining('The project\'s AndroidManifest.xml couldn\'t be updated automatically as it was in an unexpected format.')
  )
})

test('addApiKey(): missing file', async () => {
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockRejectedValue(await generateNotFoundError())

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  await addApiKey('/random/path', 'API_KEY_GOES_HERE', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/src/main/AndroidManifest.xml', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toHaveBeenCalledWith(
    expect.stringContaining('The Android configuration was not in the expected location')
  )
})
