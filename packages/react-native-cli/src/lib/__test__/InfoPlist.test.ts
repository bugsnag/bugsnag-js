import { configure } from '../InfoPlist'
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
  return { promises: { readFile: jest.fn(), writeFile: jest.fn(), readdir: jest.fn() } }
})

afterEach(() => jest.resetAllMocks())

test('configure(): success', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['BugsnagReactNativeCliTest.xcodeproj'])

  const infoPlist = await loadFixture(path.join(__dirname, 'fixtures', 'Info-before.plist'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(infoPlist)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()

  await configure('/random/path', { apiKey: 'API_KEY_GOES_HERE' }, logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/ios/BugsnagReactNativeCliTest/Info.plist', 'utf8')
  expect(writeFileMock).toHaveBeenCalledWith(
    '/random/path/ios/BugsnagReactNativeCliTest/Info.plist',
    await loadFixture(path.join(__dirname, 'fixtures', 'Info-after.plist')),
    'utf8'
  )
})

test('configure(): skips properties that are already present', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['BugsnagReactNativeCliTest.xcodeproj'])

  const infoPlist = await loadFixture(path.join(__dirname, 'fixtures', 'Info-after.plist'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(infoPlist)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()

  await configure(
    '/random/path',
    {
      apiKey: 'API key 2',
      notifyEndpoint: 'notify.example.com',
      sessionsEndpoint: 'sessions.example.com'
    },
    logger
  )

  expect(readFileMock).toHaveBeenCalledWith('/random/path/ios/BugsnagReactNativeCliTest/Info.plist', 'utf8')

  expect(logger.warn).toHaveBeenCalledTimes(1)
  expect(logger.warn).toHaveBeenCalledWith('API key is already present, skipping')

  expect(writeFileMock).toHaveBeenCalledWith(
    '/random/path/ios/BugsnagReactNativeCliTest/Info.plist',
    await loadFixture(path.join(__dirname, 'fixtures', 'Info-after-with-endpoints.plist')),
    'utf8'
  )
})

test('configure(): does not write file if all properties are already present', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['BugsnagReactNativeCliTest.xcodeproj'])

  const infoPlist = await loadFixture(path.join(__dirname, 'fixtures', 'Info-after-with-endpoints.plist'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(infoPlist)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()

  await configure(
    '/random/path',
    {
      apiKey: 'API_KEY_GOES_HERE',
      notifyEndpoint: 'notify.example.com',
      sessionsEndpoint: 'sessions.example.com'
    },
    logger
  )

  expect(readFileMock).toHaveBeenCalledWith('/random/path/ios/BugsnagReactNativeCliTest/Info.plist', 'utf8')

  expect(logger.warn).toHaveBeenCalledTimes(3)
  expect(logger.warn).toHaveBeenCalledWith('API key is already present, skipping')
  expect(logger.warn).toHaveBeenCalledWith('Notify endpoint is already present, skipping')
  expect(logger.warn).toHaveBeenCalledWith('Sessions endpoint is already present, skipping')

  expect(writeFileMock).not.toHaveBeenCalled()
})

test('configure(): unlocated project', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['floop'])

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  await configure('/random/path', { apiKey: 'API_KEY_GOES_HERE' }, logger)
  expect(readFileMock).not.toHaveBeenCalled()
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('The Xcode configuration was not in the expected location'))
})

test('configure(): unlocated project #2', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockRejectedValue(await generateNotFoundError())

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  await configure('/random/path', { apiKey: 'API_KEY_GOES_HERE' }, logger)
  expect(readFileMock).not.toHaveBeenCalled()
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('The Xcode configuration was not in the expected location'))
})

test('configure(): bad xml', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['BugsnagReactNativeCliTest.xcodeproj'])

  const infoPlist = 'not xml'
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(infoPlist)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  await configure('/random/path', { apiKey: 'API_KEY_GOES_HERE' }, logger)
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('The project\'s Info.plist couldn\'t be updated automatically.'))
})
