import { modifyAppBuildGradle, modifyRootBuildGradle } from '../Gradle'
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

test('modifyRootBuildGradle(): success', async () => {
  const rootBuildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'root-build-before.gradle'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(rootBuildGradle)
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()
  await modifyRootBuildGradle('/random/path', '5.+', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/build.gradle', 'utf8')
  expect(writeFileMock).toHaveBeenCalledWith(
    '/random/path/android/build.gradle',
    await loadFixture(path.join(__dirname, 'fixtures', 'root-build-after.gradle')),
    'utf8'
  )
})

test('modifyRootBuildGradle(): tolerates errors', async () => {
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue('not a gradle file')
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()
  await modifyRootBuildGradle('/random/path', '5.+', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/build.gradle', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()
  expect(logger.warn).toHaveBeenCalledWith(
    expect.stringContaining('The gradle file was in an unexpected format and so couldn\'t be updated automatically')
  )
})

test('modifyRootBuildGradle(): skips when no changes are required', async () => {
  const rootBuildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'root-build-after.gradle'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(rootBuildGradle)
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()
  await modifyRootBuildGradle('/random/path', '5.+', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/build.gradle', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()
  expect(logger.warn).toHaveBeenCalledWith(
    expect.stringContaining('Value already found in file, skipping.')
  )
})

test('modifyRootBuildGradle(): tolerates missing gradle file', async () => {
  const notFoundErr = await generateNotFoundError()
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockRejectedValue(notFoundErr)
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()
  await modifyRootBuildGradle('/random/path', '5.+', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/build.gradle', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()
  expect(logger.warn).toHaveBeenCalledWith(
    expect.stringContaining('A gradle file was not found at the expected location and so couldn\'t be updated automatically.')
  )
})

test('modifyRootBuildGradle(): passes on unknown errors', async () => {
  const unknownErr = new Error('Unknown error')
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockRejectedValue(unknownErr)
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()
  await expect(modifyRootBuildGradle('/random/path', '5.+', logger)).rejects.toThrowError('Unknown error')
})

test('modifyAppBuildGradle(): success', async () => {
  const appBuildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-before.gradle'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(appBuildGradle)
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()
  await modifyAppBuildGradle('/random/path', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/build.gradle', 'utf8')
  expect(writeFileMock).toHaveBeenCalledWith(
    '/random/path/android/app/build.gradle',
    await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after.gradle')),
    'utf8'
  )
})

test('modifyAppBuildGradle(): tolerates gradle format errors', async () => {
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue('not a gradle file')
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()
  await modifyAppBuildGradle('/random/path', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/build.gradle', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()
  expect(logger.warn).toHaveBeenCalledWith(
    expect.stringContaining('The gradle file was in an unexpected format and so couldn\'t be updated automatically')
  )
})

test('modifyAppBuildGradle(): skips when no changes are required', async () => {
  const appBuildGradle = await loadFixture(path.join(__dirname, 'fixtures', 'app-build-after.gradle'))
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue(appBuildGradle)
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()
  await modifyAppBuildGradle('/random/path', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/build.gradle', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()
  expect(logger.warn).toHaveBeenCalledWith(
    expect.stringContaining('Value already found in file, skipping.')
  )
})

test('modifyAppBuildGradle(): tolerates missing gradle file', async () => {
  const notFoundErr = await generateNotFoundError()
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockRejectedValue(notFoundErr)
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()
  await modifyAppBuildGradle('/random/path', logger)
  expect(readFileMock).toHaveBeenCalledWith('/random/path/android/app/build.gradle', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalled()
  expect(logger.warn).toHaveBeenCalledWith(
    expect.stringContaining('A gradle file was not found at the expected location and so couldn\'t be updated automatically.')
  )
})

test('modifyAppBuildGradle(): passes on unknown errors', async () => {
  const unknownErr = new Error('Unknown error')
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockRejectedValue(unknownErr)
  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()
  await expect(modifyAppBuildGradle('/random/path', logger)).rejects.toThrowError('Unknown error')
})
