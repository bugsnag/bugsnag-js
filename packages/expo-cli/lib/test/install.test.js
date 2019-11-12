/* global describe, it, expect */

const prepareFixture = require('./lib/prepare-fixture')
const proxyquire = require('proxyquire').noPreserveCache().noCallThru()
const { EventEmitter } = require('events')
const { Readable } = require('stream')

describe('expo-cli: install', () => {
  it('should work on a fresh project (npm)', async () => {
    const projectRoot = await prepareFixture('blank-00')

    const spawn = (cmd, args, opts) => {
      expect(cmd).toBe('npm')
      expect(args).toEqual(['install', '@bugsnag/expo@latest'])
      expect(opts).toEqual({ cwd: projectRoot })
      const proc = new EventEmitter()
      proc.stdout = new Readable({
        read () {
          this.push('some data on stdout')
          this.push(null)
        }
      })
      proc.stderr = new Readable({
        read () {
          this.push('some data on stderr')
          this.push(null)
        }
      })
      setTimeout(() => proc.emit('close', 0), 10)
      return proc
    }

    const install = proxyquire('../install', { child_process: { spawn } })
    const msg = await install('npm', 'latest', projectRoot)
    expect(msg).toBe(undefined)
  })

  it('should work on a fresh project (yarn)', async () => {
    const projectRoot = await prepareFixture('blank-00')

    const spawn = (cmd, args, opts) => {
      expect(cmd).toBe('yarn')
      expect(args).toEqual(['add', '@bugsnag/expo@6.3.1'])
      expect(opts).toEqual({ cwd: projectRoot })
      const proc = new EventEmitter()
      proc.stdout = new Readable({
        read () {
          this.push('some data on stdout')
          this.push(null)
        }
      })
      proc.stderr = new Readable({
        read () {
          this.push('some data on stderr')
          this.push(null)
        }
      })
      setTimeout(() => proc.emit('close', 0), 10)
      return proc
    }

    const install = proxyquire('../install', { child_process: { spawn } })
    const msg = await install('yarn', '6.3.1', projectRoot)
    expect(msg).toBe(undefined)
  })

  it('should add stderr/stdout output onto error if there is one (non-zero exit code)', async () => {
    const projectRoot = await prepareFixture('blank-00')

    const spawn = (cmd, args, opts) => {
      const proc = new EventEmitter()
      proc.stdout = new Readable({
        read () {
          this.push('some data on stdout')
          this.push(null)
        }
      })
      proc.stderr = new Readable({
        read () {
          this.push('some data on stderr')
          this.push(null)
        }
      })
      setTimeout(() => proc.emit('close', 1), 10)
      return proc
    }

    const install = proxyquire('../install', { child_process: { spawn } })
    try {
      await install('yarn', 'latest', projectRoot)
      expect('should not be here').toBe(false)
    } catch (e) {
      expect(e.message).toMatch(/Command exited with non-zero exit code/)
      expect(e.message).toMatch(/some data on stdout/)
      expect(e.message).toMatch(/some data on stderr/)
    }
  })

  it('should throw an error if the command does', async () => {
    const projectRoot = await prepareFixture('blank-00')

    const spawn = (cmd, args, opts) => {
      const proc = new EventEmitter()
      proc.stdout = new Readable({
        read () {
          this.push('some data on stdout')
          this.push(null)
        }
      })
      proc.stderr = new Readable({
        read () {
          this.push('some data on stderr')
          this.push(null)
        }
      })
      setTimeout(() => proc.emit('error', new Error('floop')), 10)
      return proc
    }

    const install = proxyquire('../install', { child_process: { spawn } })
    try {
      await install('yarn', 'latest', projectRoot)
      expect('should not be here').toBe(false)
    } catch (e) {
      expect(e.message).toMatch(/floop/)
    }
  })

  it('should throw an error if the packageManager option is missing', async () => {
    const projectRoot = await prepareFixture('blank-00')

    const spawn = (cmd, args, opts) => {}

    const install = proxyquire('../install', { child_process: { spawn } })
    try {
      await install(undefined, 'latest', projectRoot)
      expect('should not be here').toBe(false)
    } catch (e) {
      expect(e.message).toMatch(/Don’t know what command to use for /)
    }
  })
})
