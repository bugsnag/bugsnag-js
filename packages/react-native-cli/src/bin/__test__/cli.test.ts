import run from '../cli'
import logger from '../../Logger'

jest.mock('../../Logger')

beforeEach(() => {
  process.exitCode = 0
})

test('cli: prints help', async () => {
  const logSpy = jest.spyOn(global.console, 'log').mockImplementation(jest.fn())
  await run(['--help'])
  expect(logSpy).toHaveBeenCalled()
  expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('bugsnag-react-native-cli <command>'))
})

test('cli: version', async () => {
  const logSpy = jest.spyOn(global.console, 'log').mockImplementation(jest.fn())
  await run(['--version'])
  expect(logSpy).toHaveBeenCalled()
  expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('bugsnag-react-native-cli v'))
})

test('cli: duplicate option', async () => {
  await run(['--help', '--help'])
  expect(logger.error).toHaveBeenCalledWith('Invalid options. Singular option already set [help=true]')
})

test('cli: unrecognised command', async () => {
  await run(['xyz'])
  expect(logger.error).toHaveBeenCalledWith('Unrecognized command "xyz".')
})
