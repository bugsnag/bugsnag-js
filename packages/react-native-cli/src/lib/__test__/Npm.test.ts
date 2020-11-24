import { install, detectInstalled, guessPackageManager, PackageManager } from '../Npm'
import path from 'path'
import { promises as fs } from 'fs'
import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'

async function generateNotFoundError () {
  try {
    await jest.requireActual('fs').promises.readFile(path.join(__dirname, 'does-not-exist.txt'))
  } catch (e) {
    return e
  }
}

jest.mock('fs', () => {
  return { promises: { readFile: jest.fn(), writeFile: jest.fn() } }
})
jest.mock('child_process')

afterEach(() => jest.resetAllMocks())

test('guessPackageManager(): yarn', async () => {
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue('<example yarn lock content>')
  expect(await guessPackageManager('/example/dir')).toBe('yarn')
  expect(readFileMock).toHaveBeenCalledWith('/example/dir/yarn.lock')
})

test('guessPackageManager(): npm', async () => {
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockRejectedValue(await generateNotFoundError())
  expect(await guessPackageManager('/example/dir')).toBe('npm')
  expect(readFileMock).toHaveBeenCalledWith('/example/dir/yarn.lock')
})

test('detectInstalled(): installed in deps', async () => {
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue('{"dependencies": { "@bugsnag/test-package": "~1.0.0"} }')
  expect(await detectInstalled('@bugsnag/test-package', '/example/dir')).toBe(true)
  expect(readFileMock).toHaveBeenCalledWith('/example/dir/package.json', 'utf8')
})

test('detectInstalled(): installed in dev deps', async () => {
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue('{"devDependencies": { "@bugsnag/test-package": "~1.0.0"} }')
  expect(await detectInstalled('@bugsnag/test-package', '/example/dir')).toBe(true)
  expect(readFileMock).toHaveBeenCalledWith('/example/dir/package.json', 'utf8')
})

test('detectInstalled(): not installed', async () => {
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue('{"dependencies": { "react-native": "~1.0.0"} }')
  expect(await detectInstalled('@bugsnag/test-package', '/example/dir')).toBe(false)
  expect(readFileMock).toHaveBeenCalledWith('/example/dir/package.json', 'utf8')
})

test('detectInstalled(): error reading JSON', async () => {
  const readFileMock = fs.readFile as jest.MockedFunction<typeof fs.readFile>
  readFileMock.mockResolvedValue('not json')
  await expect(detectInstalled('@bugsnag/test-package', '/example/dir'))
    .rejects.toThrowError('Could not load package.json. Is this the project root?')
  expect(readFileMock).toHaveBeenCalledWith('/example/dir/package.json', 'utf8')
})

test('install(): npm success', async () => {
  const spawnMock = spawn as jest.MockedFunction<typeof spawn>
  spawnMock.mockImplementation(() => {
    const ee = new EventEmitter() as ChildProcess
    process.nextTick(() => ee.emit('close', 0))
    return ee
  })
  await install('npm', '@bugsnag/test-package', 'latest', false, '/example/dir')
  expect(spawnMock).toHaveBeenCalledWith('npm', ['install', '--save', '@bugsnag/test-package@latest'], { cwd: '/example/dir', stdio: 'inherit' })
})

test('install(): npm error', async () => {
  const spawnMock = spawn as jest.MockedFunction<typeof spawn>
  spawnMock.mockImplementation(() => {
    const ee = new EventEmitter() as ChildProcess
    process.nextTick(() => ee.emit('close', 1))
    return ee
  })
  await expect(install('npm', '@bugsnag/test-package', 'latest', false, '/example/dir')).rejects.toThrow('Command exited with non-zero exit code')
  expect(spawnMock).toHaveBeenCalledWith('npm', ['install', '--save', '@bugsnag/test-package@latest'], { cwd: '/example/dir', stdio: 'inherit' })
})

test('install(): npm success - dev', async () => {
  const spawnMock = spawn as jest.MockedFunction<typeof spawn>
  spawnMock.mockImplementation(() => {
    const ee = new EventEmitter() as ChildProcess
    process.nextTick(() => ee.emit('close', 0))
    return ee
  })
  await install('npm', '@bugsnag/test-package', 'latest', true, '/example/dir')
  expect(spawnMock).toHaveBeenCalledWith('npm', ['install', '--save-dev', '@bugsnag/test-package@latest'], { cwd: '/example/dir', stdio: 'inherit' })
})

test('install(): yarn success', async () => {
  const spawnMock = spawn as jest.MockedFunction<typeof spawn>
  spawnMock.mockImplementation(() => {
    const ee = new EventEmitter() as ChildProcess
    process.nextTick(() => ee.emit('close', 0))
    return ee
  })
  await install('yarn', '@bugsnag/test-package', 'latest', false, '/example/dir')
  expect(spawnMock).toHaveBeenCalledWith('yarn', ['add', '@bugsnag/test-package@latest'], { cwd: '/example/dir', stdio: 'inherit' })
})

test('install(): yarn error', async () => {
  const err = new Error('oh no')
  const spawnMock = spawn as jest.MockedFunction<typeof spawn>
  spawnMock.mockImplementation(() => {
    const ee = new EventEmitter() as ChildProcess
    process.nextTick(() => ee.emit('error', err))
    return ee
  })
  await expect(install('yarn', '@bugsnag/test-package', 'latest', false, '/example/dir')).rejects.toThrow(err)
  expect(spawnMock).toHaveBeenCalledWith('yarn', ['add', '@bugsnag/test-package@latest'], { cwd: '/example/dir', stdio: 'inherit' })
})

test('install(): yarn success - dev', async () => {
  const spawnMock = spawn as jest.MockedFunction<typeof spawn>
  spawnMock.mockImplementation(() => {
    const ee = new EventEmitter() as ChildProcess
    process.nextTick(() => ee.emit('close', 0))
    return ee
  })
  await install('yarn', '@bugsnag/test-package', 'latest', true, '/example/dir')
  expect(spawnMock).toHaveBeenCalledWith('yarn', ['add', '--dev', '@bugsnag/test-package@latest'], { cwd: '/example/dir', stdio: 'inherit' })
})

test('install(): unknown package manager', async () => {
  await expect(install('noopm' as PackageManager, '@bugsnag/test-package', '1.2.3', false, '/example/dir'))
    .rejects.toThrowError('Don’t know what command to use for noopm')
})
