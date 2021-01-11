import { install } from '../Pod'
import path from 'path'
import { promises as fs } from 'fs'
import { spawnSync } from 'child_process'
import logger from '../../Logger'

jest.mock('os', () => ({
  platform: () => 'darwin'
}))

async function generateNotFoundError () {
  try {
    await jest.requireActual('fs').promises.readdir(path.join(__dirname, 'does-not-exist'))
  } catch (e) {
    return e
  }
}

jest.mock('fs', () => ({
  promises: { readFile: jest.fn(), writeFile: jest.fn(), readdir: jest.fn() }
}))
jest.mock('child_process')
jest.mock('../../Logger')

afterEach(() => jest.resetAllMocks())

test('install(): success', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['Pods', 'MyProject', 'MyProject.xcodeproj', 'Podfile'])

  const spawnMock = spawnSync as jest.MockedFunction<typeof spawnSync>
  spawnMock.mockReturnValue({ status: 0 })

  await install('/example/dir', logger)
  expect(spawnMock).toHaveBeenCalledWith('pod', ['install'], { cwd: '/example/dir/ios', stdio: 'inherit' })
})

test('install(): no podfile', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['Pods', 'MyProject', 'MyProject.xcodeproj'])

  const spawnMock = spawnSync as jest.MockedFunction<typeof spawnSync>
  spawnMock.mockReturnValue({ status: 0 })

  await install('/example/dir', logger)
  expect(spawnMock).not.toHaveBeenCalled()
  expect(logger.warn).toHaveBeenCalledWith('No Podfile found in ios directory, skipping')
})

test('install(): no ios dir', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockRejectedValue(await generateNotFoundError())

  const spawnMock = spawnSync as jest.MockedFunction<typeof spawnSync>
  spawnMock.mockReturnValue({ status: 0 })

  await install('/example/dir', logger)
  expect(spawnMock).not.toHaveBeenCalled()
  expect(logger.warn).toHaveBeenCalledWith('No ios directory found in project, skipping')
})

test('install(): bad exit code', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['Pods', 'MyProject', 'MyProject.xcodeproj', 'Podfile'])

  const spawnMock = spawnSync as jest.MockedFunction<typeof spawnSync>
  spawnMock.mockReturnValue({ status: 1 })

  await expect(install('/example/dir', logger)).rejects.toThrow('Command "pod install" exited with non-zero exit code (1)')
  expect(spawnMock).toHaveBeenCalledWith('pod', ['install'], { cwd: '/example/dir/ios', stdio: 'inherit' })
})

test('install(): ENOENT error from cocoapods', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['Pods', 'MyProject', 'MyProject.xcodeproj', 'Podfile'])

  const error = new Error('oh dear')
  error.code = 'ENOENT'

  const spawnMock = spawnSync as jest.MockedFunction<typeof spawnSync>
  spawnMock.mockImplementation(() => ({ error, status: 255 }))

  await install('/example/dir', logger)

  expect(spawnMock).toHaveBeenCalledWith('pod', ['install'], { cwd: '/example/dir/ios', stdio: 'inherit' })
  expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('CocoaPods does not appear to be installed.'))
})

test('install(): unknown child process error', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['Pods', 'MyProject', 'MyProject.xcodeproj', 'Podfile'])

  const spawnMock = spawnSync as jest.MockedFunction<typeof spawnSync>
  spawnMock.mockImplementation(() => { throw new Error('uh oh') })

  await expect(install('/example/dir', logger)).rejects.toThrow('uh oh')
  expect(spawnMock).toHaveBeenCalledWith('pod', ['install'], { cwd: '/example/dir/ios', stdio: 'inherit' })
})

test('install(): unknown error', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockRejectedValue(new Error('uh oh'))

  const spawnMock = spawnSync as jest.MockedFunction<typeof spawnSync>

  await expect(install('/example/dir', logger)).rejects.toThrow('uh oh')
  expect(spawnMock).not.toHaveBeenCalled()
})
