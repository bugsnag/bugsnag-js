import { detectState, RepoState } from '../Repo'
import logger from '../../Logger'

import { spawnSync, SpawnSyncOptionsWithStringEncoding, SpawnSyncReturns } from 'child_process'

jest.mock('child_process')
jest.mock('../../Logger')

afterEach(() => jest.resetAllMocks())
type spawnSyncFn = (command: string, args?: readonly string[], options?: SpawnSyncOptionsWithStringEncoding) => SpawnSyncReturns<string>

test('detectState(): no repo', async () => {
  const spawnSyncMock = (spawnSync as unknown as jest.MockedFunction<spawnSyncFn>)
  spawnSyncMock.mockReturnValue({
    status: 128,
    signal: null,
    output: [
      '',
      '',
      'fatal: not a git repository (or any of the parent directories): .git\n'
    ],
    pid: 185,
    stdout: '',
    stderr: 'fatal: not a git repository (or any of the parent directories): .git\n'
  })

  expect(detectState('/example/dir', logger)).toBe(RepoState.NONE)
  expect(spawnSyncMock).toHaveBeenCalledWith('git', ['status', '--porcelain'], { cwd: '/example/dir', encoding: 'utf8' })
})

test('detectState(): dirty repo', async () => {
  const spawnSyncMock = (spawnSync as unknown as jest.MockedFunction<spawnSyncFn>)
  spawnSyncMock.mockReturnValue({
    status: 0,
    signal: null,
    output: [
      '',
      '?? index.js\n?? package.json\n',
      ''
    ],
    pid: 304,
    stdout: '?? index.js\n?? package.json\n',
    stderr: ''
  })

  expect(detectState('/example/dir', logger)).toBe(RepoState.GIT_DIRTY)
  expect(spawnSyncMock).toHaveBeenCalledWith('git', ['status', '--porcelain'], { cwd: '/example/dir', encoding: 'utf8' })
})

test('detectState(): clean repo', async () => {
  const spawnSyncMock = (spawnSync as unknown as jest.MockedFunction<spawnSyncFn>)
  spawnSyncMock.mockReturnValue({
    status: 0,
    signal: null,
    output: [
      '',
      '',
      ''
    ],
    pid: 198,
    stdout: '',
    stderr: ''
  })

  expect(detectState('/example/dir', logger)).toBe(RepoState.GIT_CLEAN)
  expect(spawnSyncMock).toHaveBeenCalledWith('git', ['status', '--porcelain'], { cwd: '/example/dir', encoding: 'utf8' })
})

test('detectState(): unknown error', async () => {
  const spawnSyncMock = (spawnSync as unknown as jest.MockedFunction<spawnSyncFn>)
  const error = new Error('fail')
  spawnSyncMock.mockReturnValue({
    status: 0,
    signal: null,
    output: [
      '',
      '',
      ''
    ],
    pid: 198,
    stdout: '',
    stderr: '',
    error
  })

  expect(detectState('/example/dir', logger)).toBe(RepoState.UNKNOWN)
  expect(spawnSyncMock).toHaveBeenCalledWith('git', ['status', '--porcelain'], { cwd: '/example/dir', encoding: 'utf8' })
  expect(logger.warn).toHaveBeenCalledWith(error)
})

test('detectState(): ENOENT error should not log a warning', async () => {
  const spawnSyncMock = (spawnSync as unknown as jest.MockedFunction<spawnSyncFn>)
  const error = new Error('fail')
  error.code = 'ENOENT'

  spawnSyncMock.mockReturnValue({
    status: 0,
    signal: null,
    output: [
      '',
      '',
      ''
    ],
    pid: 198,
    stdout: '',
    stderr: '',
    error
  })

  expect(detectState('/example/dir', logger)).toBe(RepoState.UNKNOWN)
  expect(spawnSyncMock).toHaveBeenCalledWith('git', ['status', '--porcelain'], { cwd: '/example/dir', encoding: 'utf8' })
  expect(logger.warn).not.toHaveBeenCalled()
})
