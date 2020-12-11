import { configure } from '../AndroidManifest'
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

test('configure(): success (only API key)', async () => {
  const androidManifest = await loadFixture(path.join(__dirname, 'fixtures', 'AndroidManifest-before.xml'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(androidManifest)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()

  await configure('/random/path', { apiKey: 'API_KEY_GOES_HERE' }, logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/src/main/AndroidManifest.xml', 'utf8')
  expect(writeFileMock).toHaveBeenCalledWith(
    '/random/path/android/app/src/main/AndroidManifest.xml',
    await loadFixture(path.join(__dirname, 'fixtures', 'AndroidManifest-after.xml')),
    'utf8'
  )
})

test('configure(): success (API key and endpoints)', async () => {
  const androidManifest = await loadFixture(path.join(__dirname, 'fixtures', 'AndroidManifest-before.xml'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(androidManifest)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()

  const options = {
    apiKey: 'API_KEY_GOES_HERE',
    notifyEndpoint: 'NOTIFY_ENDPOINT_GOES_HERE',
    sessionsEndpoint: 'SESSIONS_ENDPOINT_GOES_HERE'
  }

  await configure('/random/path', options, logger)

  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/src/main/AndroidManifest.xml', 'utf8')
  expect(writeFileMock).toHaveBeenCalledWith(
    '/random/path/android/app/src/main/AndroidManifest.xml',
    await loadFixture(path.join(__dirname, 'fixtures', 'AndroidManifest-after-with-endpoints.xml')),
    'utf8'
  )
})

test('configure(): API key only, already present', async () => {
  const androidManifest = await loadFixture(path.join(__dirname, 'fixtures', 'AndroidManifest-after.xml'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(androidManifest)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()

  await configure('/random/path', { apiKey: 'API_KEY_GOES_HERE' }, logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/src/main/AndroidManifest.xml', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toHaveBeenCalledWith('API key is already present, skipping')
})

test('configure(): API key and endpoints, API key already present', async () => {
  const androidManifest = await loadFixture(path.join(__dirname, 'fixtures', 'AndroidManifest-after.xml'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(androidManifest)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()

  const options = {
    apiKey: 'a different API key than in the fixture to prove that it doesnt change',
    notifyEndpoint: 'NOTIFY_ENDPOINT_GOES_HERE',
    sessionsEndpoint: 'SESSIONS_ENDPOINT_GOES_HERE'
  }

  await configure('/random/path', options, logger)

  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/src/main/AndroidManifest.xml', 'utf8')
  expect(writeFileMock).toHaveBeenCalledWith(
    '/random/path/android/app/src/main/AndroidManifest.xml',
    await loadFixture(path.join(__dirname, 'fixtures', 'AndroidManifest-after-with-endpoints.xml')),
    'utf8'
  )

  expect(logger.warn).toHaveBeenCalledWith('API key is already present, skipping')
})

test('configure(): API key and endpoints, all already present', async () => {
  const androidManifest = await loadFixture(path.join(__dirname, 'fixtures', 'AndroidManifest-after-with-endpoints.xml'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(androidManifest)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()

  const options = {
    apiKey: 'a different API key than in the fixtures',
    notifyEndpoint: 'NOTIFY_ENDPOINT_GOES_HERE',
    sessionsEndpoint: 'SESSIONS_ENDPOINT_GOES_HERE'
  }

  await configure('/random/path', options, logger)

  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/src/main/AndroidManifest.xml', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toHaveBeenCalledWith('API key is already present, skipping')
  expect(logger.warn).toHaveBeenCalledWith('Notify endpoint is already present, skipping')
  expect(logger.warn).toHaveBeenCalledWith('Sessions endpoint is already present, skipping')
})

test('configure(): self closing application tag', async () => {
  const androidManifest =
`<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.bugsnagreactnativeclitest">
  <application/>
</manifest>`

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(androidManifest)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  await configure('/random/path', { apiKey: 'API_KEY_GOES_HERE' }, logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/src/main/AndroidManifest.xml', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toHaveBeenCalledWith(
    expect.stringContaining('The project\'s AndroidManifest.xml couldn\'t be updated automatically as it was in an unexpected format.')
  )
})

test('configure(): missing file', async () => {
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockRejectedValue(await generateNotFoundError())

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  await configure('/random/path', { apiKey: 'API_KEY_GOES_HERE' }, logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/src/main/AndroidManifest.xml', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toHaveBeenCalledWith(
    expect.stringContaining('The Android configuration was not in the expected location')
  )
})

test('configure(): API key only, missing file', async () => {
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockRejectedValue(await generateNotFoundError())

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  await configure('/random/path', { apiKey: 'API_KEY_GOES_HERE' }, logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/src/main/AndroidManifest.xml', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toHaveBeenCalledWith(
    `The Android configuration was not in the expected location and so couldn't be updated automatically.

Add your API key to the AndroidManifest.xml in your project.

See https://docs.bugsnag.com/platforms/react-native/react-native/#android for more information`
  )
})

test('configure(): endpoints only, missing file', async () => {
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockRejectedValue(await generateNotFoundError())

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  const options = {
    notifyEndpoint: 'NOTIFY_ENDPOINT_GOES_HERE',
    sessionsEndpoint: 'SESSIONS_ENDPOINT_GOES_HERE'
  }

  await configure('/random/path', options, logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/src/main/AndroidManifest.xml', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toHaveBeenCalledWith(
    `The Android configuration was not in the expected location and so couldn't be updated automatically.

Add your notify endpoint and sessions endpoint to the AndroidManifest.xml in your project.

See https://docs.bugsnag.com/platforms/react-native/react-native/#android for more information`
  )
})

test('configure(): all options, missing file', async () => {
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockRejectedValue(await generateNotFoundError())

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  const options = {
    apiKey: 'API_KEY_GOES_HERE',
    notifyEndpoint: 'NOTIFY_ENDPOINT_GOES_HERE',
    sessionsEndpoint: 'SESSIONS_ENDPOINT_GOES_HERE'
  }

  await configure('/random/path', options, logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/src/main/AndroidManifest.xml', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toHaveBeenCalledWith(
    `The Android configuration was not in the expected location and so couldn't be updated automatically.

Add your API key, notify endpoint and sessions endpoint to the AndroidManifest.xml in your project.

See https://docs.bugsnag.com/platforms/react-native/react-native/#android for more information`
  )
})
