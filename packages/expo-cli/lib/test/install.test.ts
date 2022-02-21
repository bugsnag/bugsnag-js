/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable jest/no-try-expect */
import { prepareFixture } from './lib/prepare-fixture'
import { EventEmitter } from 'events'
import { Readable } from 'stream'

describe('expo-cli: install', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('should work on a fresh project (npm)', async () => {
    const { target: projectRoot, clean } = await prepareFixture('blank-00')

    const spawn = (cmd: string, args: string[], opts: {}) => {
      expect(cmd).toBe('npm')
      expect(args).toEqual(['install', '@bugsnag/expo@latest'])
      expect(opts).toEqual({ cwd: projectRoot })
      const proc = new EventEmitter()
      // @ts-ignore
      proc.stdout = new Readable({
        read () {
          this.push('some data on stdout')
          this.push(null)
        }
      })
      // @ts-ignore
      proc.stderr = new Readable({
        read () {
          this.push('some data on stderr')
          this.push(null)
        }
      })
      setTimeout(() => proc.emit('close', 0), 10)
      return proc
    }

    jest.doMock('child_process', () => ({ spawn }))
    const install = require('../install')

    const msg = await install('npm', 'latest', projectRoot)
    expect(msg).toBe(undefined)
    await clean()
  })

  it('should work on a fresh project (yarn)', async () => {
    const { target: projectRoot, clean } = await prepareFixture('blank-00')

    const spawn = (cmd: string, args: string[], opts: {}) => {
      expect(cmd).toBe('yarn')
      expect(args).toEqual(['add', '@bugsnag/expo@6.3.1'])
      expect(opts).toEqual({ cwd: projectRoot })
      const proc = new EventEmitter()
      // @ts-ignore
      proc.stdout = new Readable({
        read () {
          this.push('some data on stdout')
          this.push(null)
        }
      })
      // @ts-ignore
      proc.stderr = new Readable({
        read () {
          this.push('some data on stderr')
          this.push(null)
        }
      })
      setTimeout(() => proc.emit('close', 0), 10)
      return proc
    }

    jest.doMock('child_process', () => ({ spawn }))
    const install = require('../install')

    const msg = await install('yarn', '6.3.1', projectRoot)
    expect(msg).toBe(undefined)
    await clean()
  })

  it('should add stderr/stdout output onto error if there is one (non-zero exit code)', async () => {
    const { target: projectRoot, clean } = await prepareFixture('blank-00')

    const spawn = (cmd: string, args: string[], opts: {}) => {
      const proc = new EventEmitter()
      // @ts-ignore
      proc.stdout = new Readable({
        read () {
          this.push('some data on stdout')
          this.push(null)
        }
      })
      // @ts-ignore
      proc.stderr = new Readable({
        read () {
          this.push('some data on stderr')
          this.push(null)
        }
      })
      setTimeout(() => proc.emit('close', 1), 10)
      return proc
    }

    jest.doMock('child_process', () => ({ spawn }))
    const install = require('../install')

    try {
      await install('yarn', 'latest', projectRoot)
      expect('should not be here').toBe(false)
    } catch (e) {
      expect((e as Error).message).toMatch(/Command exited with non-zero exit code/)
      expect((e as Error).message).toMatch(/some data on stdout/)
      expect((e as Error).message).toMatch(/some data on stderr/)
      await clean()
    }
  })

  it('should throw an error if the command does', async () => {
    const { target: projectRoot, clean } = await prepareFixture('blank-00')

    const spawn = (cmd: string, args: string[], opts: {}) => {
      const proc = new EventEmitter()
      // @ts-ignore
      proc.stdout = new Readable({
        read () {
          this.push('some data on stdout')
          this.push(null)
        }
      })
      // @ts-ignore
      proc.stderr = new Readable({
        read () {
          this.push('some data on stderr')
          this.push(null)
        }
      })
      setTimeout(() => proc.emit('error', new Error('floop')), 10)
      return proc
    }

    jest.doMock('child_process', () => ({ spawn }))
    const install = require('../install')

    try {
      await install('yarn', 'latest', projectRoot)
      expect('should not be here').toBe(false)
    } catch (e) {
      expect((e as Error).message).toMatch(/floop/)
      await clean()
    }
  })

  it('should throw an error if the packageManager option is missing', async () => {
    const { target: projectRoot, clean } = await prepareFixture('blank-00')

    const spawn = (cmd: string, args: string[], opts: {}) => {}

    jest.doMock('child_process', () => ({ spawn }))
    const install = require('../install')

    try {
      await install(undefined, 'latest', projectRoot)
      expect('should not be here').toBe(false)
    } catch (e) {
      expect((e as Error).message).toMatch(/Don’t know what command to use for /)
      await clean()
    }
  })
})
