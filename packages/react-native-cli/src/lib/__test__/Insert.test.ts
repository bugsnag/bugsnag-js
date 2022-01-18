import { insertJs, insertAndroid, insertIos } from '../Insert'
import logger from '../../Logger'
import path from 'path'
import { promises as fs } from 'fs'
import glob from 'glob'

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
jest.mock('glob', () => {
  return jest.fn()
})

afterEach(() => jest.resetAllMocks())

test('insertJs(): success', async () => {
  const indexJs = await loadFixture(path.join(__dirname, 'fixtures', 'index-before.js'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(indexJs)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()

  await insertJs('/random/path', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/index.js', 'utf8')
  expect(writeFileMock).toHaveBeenCalledWith(
    '/random/path/index.js',
    await loadFixture(path.join(__dirname, 'fixtures', 'index-after.js')),
    'utf8'
  )
})

test('insertJs(): fail', async () => {
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockRejectedValue(await generateNotFoundError())

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  await insertJs('/random/path', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/index.js', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to update "index.js" automatically.'))
})

test('insertJs(): already present', async () => {
  const indexJs = await loadFixture(path.join(__dirname, 'fixtures', 'index-after.js'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(indexJs)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  await insertJs('/random/path', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/index.js', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toHaveBeenCalledWith('Bugsnag is already included, skipping')
})

test('insertIos(): success', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['BugsnagReactNativeCliTest.xcodeproj'])

  const appDelegate = await loadFixture(path.join(__dirname, 'fixtures', 'AppDelegate-before.m'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(appDelegate)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()

  await insertIos('/random/path', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/ios/BugsnagReactNativeCliTest/AppDelegate.m', 'utf8')
  expect(writeFileMock).toHaveBeenCalledWith(
    '/random/path/ios/BugsnagReactNativeCliTest/AppDelegate.m',
    await loadFixture(path.join(__dirname, 'fixtures', 'AppDelegate-after.m')),
    'utf8'
  )
})

test('insertIos(): already present', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['BugsnagReactNativeCliTest.xcodeproj'])

  const appDelegate = await loadFixture(path.join(__dirname, 'fixtures', 'AppDelegate-after.m'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(appDelegate)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()

  await insertIos('/random/path', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/ios/BugsnagReactNativeCliTest/AppDelegate.m', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toHaveBeenCalledWith('Bugsnag is already included, skipping')
})

test('insertIos(): failure to locate file', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['BugsnagReactNativeCliTest.xcodeproj'])

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockRejectedValue(await generateNotFoundError())

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  await insertIos('/random/path', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/ios/BugsnagReactNativeCliTest/AppDelegate.m', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to update "AppDelegate.m" automatically.'))
})

test('insertIos(): failure to locate project directory', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['nope'])

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  await insertIos('/random/path', logger)
  expect(readFileMock).not.toHaveBeenCalled()
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to update "AppDelegate.m" automatically.'))
})

test('insertIos(): project directory error', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockRejectedValue(await generateNotFoundError())

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  await insertIos('/random/path', logger)
  expect(readFileMock).not.toHaveBeenCalled()
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to update "AppDelegate.m" automatically.'))
})

test('insertIos(): no identifiable app launch method', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['BugsnagReactNativeCliTest.xcodeproj'])

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue('not good objective c')
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  await insertIos('/random/path', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/ios/BugsnagReactNativeCliTest/AppDelegate.m', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to update "AppDelegate.m" automatically.'))
})

test('insertAndroid(): success', async () => {
  const globMock = glob as unknown as jest.MockedFunction<typeof glob>
  globMock.mockImplementation((glob, opts, cb) => cb(null, ['com/bugsnagreactnativeclitest/MainApplication.java']))

  const mainApplication = await loadFixture(path.join(__dirname, 'fixtures', 'MainApplication-before.java'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(mainApplication)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  await insertAndroid('/random/path', logger)
  expect(readFileMock).toHaveBeenCalledWith(
    '/random/path/android/app/src/main/java/com/bugsnagreactnativeclitest/MainApplication.java',
    'utf8'
  )
  expect(writeFileMock).toHaveBeenCalledWith(
    '/random/path/android/app/src/main/java/com/bugsnagreactnativeclitest/MainApplication.java',
    await loadFixture(path.join(__dirname, 'fixtures', 'MainApplication-after.java')),
    'utf8'
  )
})

test('insertAndroid(): success, tolerates some differences in source', async () => {
  const globMock = glob as unknown as jest.MockedFunction<typeof glob>
  globMock.mockImplementation((glob, opts, cb) => cb(null, ['com/bugsnagreactnativeclitest/MainApplication.java']))

  const mainApplication = await loadFixture(path.join(__dirname, 'fixtures', 'MainApplication-before-2.java'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(mainApplication)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  await insertAndroid('/random/path', logger)
  expect(readFileMock).toHaveBeenCalledWith(
    '/random/path/android/app/src/main/java/com/bugsnagreactnativeclitest/MainApplication.java',
    'utf8'
  )
  expect(writeFileMock).toHaveBeenCalledWith(
    '/random/path/android/app/src/main/java/com/bugsnagreactnativeclitest/MainApplication.java',
    await loadFixture(path.join(__dirname, 'fixtures', 'MainApplication-after-2.java')),
    'utf8'
  )
})

test('insertAndroid(): already present', async () => {
  const globMock = glob as unknown as jest.MockedFunction<typeof glob>
  globMock.mockImplementation((glob, opts, cb) => cb(null, ['com/bugsnagreactnativeclitest/MainApplication.java']))

  const mainApplication = await loadFixture(path.join(__dirname, 'fixtures', 'MainApplication-after.java'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(mainApplication)

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  await insertAndroid('/random/path', logger)
  expect(readFileMock).toHaveBeenCalledWith(
    '/random/path/android/app/src/main/java/com/bugsnagreactnativeclitest/MainApplication.java',
    'utf8'
  )
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toHaveBeenCalledWith('Bugsnag is already included, skipping')
})

test('insertAndroid(): failure to locate file', async () => {
  const globMock = glob as unknown as jest.MockedFunction<typeof glob>
  globMock.mockImplementation((glob, opts, cb) => cb(null, ['com/bugsnagreactnativeclitest/MainApplication.java']))

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockRejectedValue(await generateNotFoundError())

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  await insertAndroid('/random/path', logger)
  expect(readFileMock).toHaveBeenCalledWith(
    '/random/path/android/app/src/main/java/com/bugsnagreactnativeclitest/MainApplication.java',
    'utf8'
  )
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to update "MainApplication.java" automatically.'))
})

test('insertAndroid(): failure to locate package directory', async () => {
  const globMock = glob as unknown as jest.MockedFunction<typeof glob>
  globMock.mockImplementation((glob, opts, cb) => cb(null, []))

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  await insertAndroid('/random/path', logger)
  expect(readFileMock).not.toHaveBeenCalled()
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to update "MainApplication.java" automatically.'))
})

test('insertAndroid(): project directory error', async () => {
  const globMock = glob as unknown as jest.MockedFunction<typeof glob>
  globMock.mockImplementation((glob, opts, cb) => cb(new Error('oh no'), []))

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  await insertAndroid('/random/path', logger)
  expect(readFileMock).not.toHaveBeenCalled()
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to update "MainApplication.java" automatically.'))
})

test('insertAndroid(): no identifiable onCreate method', async () => {
  const globMock = glob as unknown as jest.MockedFunction<typeof glob>
  globMock.mockImplementation((glob, opts, cb) => cb(null, ['com/bugsnagreactnativeclitest/MainApplication.java']))

  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue('not good java')
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>

  await insertAndroid('/random/path', logger)
  expect(readFileMock).toHaveBeenCalledWith(
    '/random/path/android/app/src/main/java/com/bugsnagreactnativeclitest/MainApplication.java',
    'utf8'
  )
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Failed to update "MainApplication.java" automatically.'))
})
