import plugin from '../'
import { join } from 'path'
import Event from '@bugsnag/core/event'
import { Client } from '@bugsnag/core'
import { schema } from '@bugsnag/core/config'

describe('plugin: node in project', () => {
  it('should mark stackframes as "inProject" if it is a descendent of the "projectRoot"', done => {
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
        expect(evt.errors[0].stacktrace[0].inProject).toBe(true)
        expect(evt.errors[0].stacktrace[1].inProject).toBe(true)
        expect(evt.errors[0].stacktrace[2].inProject).toBe(true)
        done()
      },
      sendSession: () => {}
    }))

    client._notify(new Event('Error', 'in project test', [
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

  it('should mark stackframes as "out of project" if it is not a descendent of "projectRoot"', done => {
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
        expect(evt.errors[0].stacktrace[0].inProject).toBe(false)
        expect(evt.errors[0].stacktrace[1].inProject).toBe(false)
        expect(evt.errors[0].stacktrace[2].inProject).toBe(false)
        done()
      },
      sendSession: () => {}
    }))

    client._notify(new Event('Error', 'in project test', [
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
        expect(evt.errors[0].stacktrace[0].inProject).toBe(false)
        expect(evt.errors[0].stacktrace[1].inProject).toBe(false)
        done()
      },
      sendSession: () => {}
    }))

    client._notify(new Event('Error', 'in project test', [
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
        expect(evt.errors[0].stacktrace[0].inProject).toBe(false)
        expect(evt.errors[0].stacktrace[1].inProject).toBe(false)
        expect(evt.errors[0].stacktrace[2].inProject).toBe(false)
        done()
      },
      sendSession: () => {}
    }))

    client._notify(new Event('Error', 'in project test', [
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
