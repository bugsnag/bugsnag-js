import { updateXcodeProject } from '../Xcode'
import logger from '../../Logger'
import path from 'path'
import { promises as fs, readFileSync } from 'fs'
import xcode, { Project } from 'xcode'

async function loadFixture (fixture: string) {
  return jest.requireActual('fs').promises.readFile(fixture, 'utf8')
}

jest.mock('../../Logger')
jest.mock('fs', () => {
  return { promises: { readFile: jest.fn(), writeFile: jest.fn(), readdir: jest.fn() }, readFileSync: jest.fn() }
})

function inlineXcodeParser () {
  // the xcode module wants to do this in a child process, which makes it hard to mock
  // this brings the logic that it would run in the forked process inline to make it easier
  // to work with
  const parser = jest.requireActual('xcode/lib/parser/pbxproj')
  xcode.project.prototype.parse = jest.fn(function (this: Project, cb) {
    try {
      const fileContents = readFileSync(this.filepath, 'utf8')
      const obj = parser.parse(fileContents)
      this.hash = obj
      cb(null, obj)
    } catch (e) {
      cb(e)
    }
    return this
  })
}

afterEach(() => jest.resetAllMocks())

test('updateXcodeProject(): success', async () => {
  inlineXcodeParser()

  const pbxProj = await loadFixture(path.join(__dirname, 'fixtures', 'project-before.pbxproj'))

  // xcode module calls readFileSync on the path provided
  const readFileSyncMock = readFileSync as jest.MockedFunction<typeof readFileSync>
  readFileSyncMock.mockReturnValue(pbxProj)

  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['BugsnagReactNativeCliTest.xcodeproj'])

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()

  await updateXcodeProject('/random/path', undefined, '0.70.0', logger)

  expect(readFileSyncMock).toHaveBeenCalledWith('/random/path/ios/BugsnagReactNativeCliTest.xcodeproj/project.pbxproj', 'utf8')
  expect(writeFileMock).toHaveBeenCalledTimes(2)

  // the added build phase gets a generated build ID, so we need to figure out what that is before doing an exact string match
  const matches = /([A-Z0-9]{24}) \/\* Upload source maps to Bugsnag \*\/ = \{/.exec(writeFileMock.mock.calls[1] as unknown as string)
  if (!matches) throw new Error('Failed to detect build ID')
  const generatedPhaseId = matches[1]
  const expectedOutput = (await loadFixture(path.join(__dirname, 'fixtures', 'project-after.pbxproj')))
    .replace(/43CF599E6AE1472FAF1EC029/g, generatedPhaseId)
  expect(writeFileMock).toHaveBeenLastCalledWith(
    '/random/path/ios/BugsnagReactNativeCliTest.xcodeproj/project.pbxproj',
    expectedOutput,
    'utf8'
  )
})

test('updateXcodeProject(): success with custom endpoint', async () => {
  inlineXcodeParser()

  const pbxProj = await loadFixture(path.join(__dirname, 'fixtures', 'project-before.pbxproj'))

  // xcode module calls readFileSync on the path provided
  const readFileSyncMock = readFileSync as jest.MockedFunction<typeof readFileSync>
  readFileSyncMock.mockReturnValue(pbxProj)

  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['BugsnagReactNativeCliTest.xcodeproj'])

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  writeFileMock.mockResolvedValue()

  await updateXcodeProject('/random/path', 'https://upload.example.com', '0.70.0', logger)

  expect(readFileSyncMock).toHaveBeenCalledWith('/random/path/ios/BugsnagReactNativeCliTest.xcodeproj/project.pbxproj', 'utf8')
  expect(writeFileMock).toHaveBeenCalledTimes(2)

  // the added build phase gets a generated build ID, so we need to figure out what that is before doing an exact string match
  const matches = /([A-Z0-9]{24}) \/\* Upload source maps to Bugsnag \*\/ = \{/.exec(writeFileMock.mock.calls[1] as unknown as string)
  if (!matches) {
    throw new Error('Failed to detect build ID')
  }

  const generatedPhaseId = matches[1]
  const expectedOutput = (await loadFixture(path.join(__dirname, 'fixtures', 'project-after-with-endpoint.pbxproj')))
    .replace(/43CF599E6AE1472FAF1EC029/g, generatedPhaseId)

  expect(writeFileMock).toHaveBeenLastCalledWith(
    '/random/path/ios/BugsnagReactNativeCliTest.xcodeproj/project.pbxproj',
    expectedOutput,
    'utf8'
  )
})

test('updateXcodeProject(): modifications already exist', async () => {
  inlineXcodeParser()

  const pbxProj = await loadFixture(path.join(__dirname, 'fixtures', 'project-after.pbxproj'))

  // xcode module calls readFileSync on the path provided
  const readFileSyncMock = readFileSync as jest.MockedFunction<typeof readFileSync>

  readFileSyncMock.mockReturnValue(pbxProj)
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['BugsnagReactNativeCliTest.xcodeproj'])

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  await updateXcodeProject('/random/path', undefined, '0.70.0', logger)
  expect(readFileSyncMock).toHaveBeenCalledWith('/random/path/ios/BugsnagReactNativeCliTest.xcodeproj/project.pbxproj', 'utf8')
  expect(writeFileMock).not.toHaveBeenCalledWith('/random/path/ios/BugsnagReactNativeCliTest.xcodeproj/project.pbxproj', 'utf8')
  expect(logger.warn).toHaveBeenCalledWith('An "Upload source maps to Bugsnag" build phase already exists')
})

test('updateXcodeProject(): can\'t find project', async () => {
  inlineXcodeParser()

  const pbxProj = await loadFixture(path.join(__dirname, 'fixtures', 'project-before.pbxproj'))

  // xcode module calls readFileSync on the path provided
  const readFileSyncMock = readFileSync as jest.MockedFunction<typeof readFileSync>

  readFileSyncMock.mockReturnValue(pbxProj)
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['sdflkj'])

  const writeFileMock = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>
  await updateXcodeProject('/random/path', undefined, '0.70.0', logger)
  expect(readFileSyncMock).not.toHaveBeenCalled()
  expect(writeFileMock).not.toHaveBeenCalled()

  expect(logger.warn).toBeCalledWith(expect.stringContaining(
    'The Xcode project was not in the expected location and so couldn\'t be updated automatically'
  ))
})
