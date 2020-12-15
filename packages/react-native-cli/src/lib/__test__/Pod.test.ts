import { install } from '../Pod'
import path from 'path'
import { promises as fs } from 'fs'
import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
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

jest.mock('fs', () => {
  return { promises: { readFile: jest.fn(), writeFile: jest.fn(), readdir: jest.fn() } }
})
jest.mock('child_process')
jest.mock('../../Logger')

afterEach(() => jest.resetAllMocks())

test('install(): success', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['Pods', 'MyProject', 'MyProject.xcodeproj', 'Podfile'])

  const spawnMock = spawn as jest.MockedFunction<typeof spawn>
  spawnMock.mockImplementation(() => {
    const ee = new EventEmitter() as ChildProcess
    process.nextTick(() => ee.emit('close', 0))
    return ee
  })

  await install('/example/dir', logger)
  expect(spawnMock).toHaveBeenCalledWith('pod', ['install'], { cwd: '/example/dir/ios', stdio: 'inherit' })
})

test('install(): no podfile', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['Pods', 'MyProject', 'MyProject.xcodeproj'])

  const spawnMock = spawn as jest.MockedFunction<typeof spawn>
  spawnMock.mockImplementation(() => {
    const ee = new EventEmitter() as ChildProcess
    process.nextTick(() => ee.emit('close', 0))
    return ee
  })

  await install('/example/dir', logger)
  expect(spawnMock).not.toHaveBeenCalled()
  expect(logger.warn).toHaveBeenCalledWith('No Podfile found in ios directory, skipping')
})

test('install(): no ios dir', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockRejectedValue(await generateNotFoundError())

  const spawnMock = spawn as jest.MockedFunction<typeof spawn>
  spawnMock.mockImplementation(() => {
    const ee = new EventEmitter() as ChildProcess
    process.nextTick(() => ee.emit('close', 0))
    return ee
  })

  await install('/example/dir', logger)
  expect(spawnMock).not.toHaveBeenCalled()
  expect(logger.warn).toHaveBeenCalledWith('No ios directory found in project, skipping')
})

test('install(): bad exit code', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['Pods', 'MyProject', 'MyProject.xcodeproj', 'Podfile'])

  const spawnMock = spawn as jest.MockedFunction<typeof spawn>
  spawnMock.mockImplementation(() => {
    const ee = new EventEmitter() as ChildProcess
    process.nextTick(() => ee.emit('close', 1))
    return ee
  })

  await expect(install('/example/dir', logger)).rejects.toThrow('Command exited with non-zero exit code (1) "pod install"')
  expect(spawnMock).toHaveBeenCalledWith('pod', ['install'], { cwd: '/example/dir/ios', stdio: 'inherit' })
})

test('install(): unknown child process error', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockResolvedValue(['Pods', 'MyProject', 'MyProject.xcodeproj', 'Podfile'])

  const spawnMock = spawn as jest.MockedFunction<typeof spawn>
  spawnMock.mockImplementation(() => {
    const ee = new EventEmitter() as ChildProcess
    process.nextTick(() => ee.emit('error', new Error('uh oh')))
    return ee
  })

  await expect(install('/example/dir', logger)).rejects.toThrow('uh oh')
  expect(spawnMock).toHaveBeenCalledWith('pod', ['install'], { cwd: '/example/dir/ios', stdio: 'inherit' })
})

test('install(): unknown error', async () => {
  type readdir = (path: string) => Promise<string[]>
  const readdirMock = fs.readdir as unknown as jest.MockedFunction<readdir>
  readdirMock.mockRejectedValue(new Error('uh oh'))

  const spawnMock = spawn as jest.MockedFunction<typeof spawn>

  await expect(install('/example/dir', logger)).rejects.toThrow('uh oh')
  expect(spawnMock).not.toHaveBeenCalled()
})
