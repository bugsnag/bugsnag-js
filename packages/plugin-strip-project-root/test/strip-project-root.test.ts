import plugin from '../'
import { join } from 'path'
import { Client, Event } from '@bugsnag/core'
import { schema } from '@bugsnag/core/config'

describe('plugin: strip project root', () => {
  it('should remove the project root if it matches the start of the stackframe’s file', done => {
    const client = new Client({ apiKey: 'api_key', projectRoot: '/app', plugins: [plugin] }, {
      ...schema,
      projectRoot: {
        validate: () => true,
        defaultValue: () => '',
        message: ''
      }
    })

    client._setDelivery(client => ({
      sendEvent: (payload) => {
        const evt = payload.events[0]
        expect(evt.errors[0].stacktrace[0].file).toBe(join('lib', '01.js'))
        expect(evt.errors[0].stacktrace[1].file).toBe(join('lib', '02.js'))
        expect(evt.errors[0].stacktrace[2].file).toBe(join('lib', '03.js'))
        done()
      },
      sendSession: () => {}
    }))

    client._notify(new Event('Error', 'strip project root test', [
      {
        lineNumber: 22,
        columnNumber: 18,
        fileName: join('/app', 'lib', '01.js')
      }, {
        lineNumber: 31,
        columnNumber: 7,
        fileName: join('/app', 'lib', '02.js')
      }, {
        lineNumber: 118,
        columnNumber: 28,
        fileName: join('/app', 'lib', '03.js')
      }
    ]))
  })

  it('should not remove a matching substring if it is not at the start', done => {
    const client = new Client({ apiKey: 'api_key', projectRoot: '/app', plugins: [plugin] }, {
      ...schema,
      projectRoot: {
        validate: () => true,
        defaultValue: () => '',
        message: ''
      }
    })

    client._setDelivery(client => ({
      sendEvent: (payload) => {
        const evt = payload.events[0]
        expect(evt.errors[0].stacktrace[0].file).toBe(join('/var', 'lib', '01.js'))
        expect(evt.errors[0].stacktrace[1].file).toBe(join('/foo', 'lib', '02.js'))
        expect(evt.errors[0].stacktrace[2].file).toBe(join('/tmp', 'lib', '03.js'))
        done()
      },
      sendSession: () => {}
    }))

    client._notify(new Event('Error', 'strip project root test', [
      {
        lineNumber: 22,
        columnNumber: 18,
        fileName: join('/var', 'lib', '01.js')
      }, {
        lineNumber: 31,
        columnNumber: 7,
        fileName: join('/foo', 'lib', '02.js')
      }, {
        lineNumber: 118,
        columnNumber: 28,
        fileName: join('/tmp', 'lib', '03.js')
      }
    ]))
  })

  it('should work with node_modules and node internals', done => {
    const client = new Client({ apiKey: 'api_key', projectRoot: '/app', plugins: [plugin] }, {
      ...schema,
      projectRoot: {
        validate: () => true,
        defaultValue: () => '',
        message: ''
      }
    })

    client._setDelivery(client => ({
      sendEvent: (payload) => {
        const evt = payload.events[0]
        expect(evt.errors[0].stacktrace[0].file).toBe('_module.js')
        expect(evt.errors[0].stacktrace[1].file).toBe(join('node_modules', 'bugsnag-example', 'index.js'))
        done()
      },
      sendSession: () => {}
    }))

    client._notify(new Event('Error', 'strip project root test', [
      {
        lineNumber: 22,
        columnNumber: 18,
        fileName: '_module.js'
      }, {
        lineNumber: 31,
        columnNumber: 7,
        fileName: join('/app', 'node_modules', 'bugsnag-example', 'index.js')
      }
    ]))
  })

  it('should tolerate stackframe.file not being a string', done => {
    const client = new Client({ apiKey: 'api_key', projectRoot: '/app', plugins: [plugin] }, {
      ...schema,
      projectRoot: {
        validate: () => true,
        defaultValue: () => '',
        message: ''
      }
    })

    client._setDelivery(client => ({
      sendEvent: (payload) => {
        const evt = payload.events[0]
        expect(evt.errors[0].stacktrace[0].file).toBe('global code')
        expect(evt.errors[0].stacktrace[1].file).toBe('global code')
        expect(evt.errors[0].stacktrace[2].file).toEqual({})
        done()
      },
      sendSession: () => {}
    }))

    client._notify(new Event('Error', 'strip project root test', [
      {
        lineNumber: 22,
        columnNumber: 18,
        fileName: undefined
      }, {
        lineNumber: 31,
        columnNumber: 7,
        fileName: null
      }, {
        lineNumber: 31,
        columnNumber: 7,
        fileName: {}
      }
    ]))
  })
})
