const { describe, it, expect } = global

const plugin = require('../')
const { join } = require('path')
const Event = require('@bugsnag/core/event')
const Client = require('@bugsnag/core/client')
const { schema } = require('@bugsnag/core/config')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: node in project', () => {
  it('should mark stackframes as "inProject" if it is a descendent of the "projectRoot"', done => {
    const client = new Client({ apiKey: 'api_key', projectRoot: '/app' }, {
      ...schema,
      projectRoot: {
        validate: () => true,
        defaultValue: () => '',
        message: ''
      }
    }, VALID_NOTIFIER)

    client._delivery(client => ({
      sendEvent: (payload) => {
        const evt = payload.events[0]
        expect(evt.errors[0].stacktrace[0].inProject).toBe(true)
        expect(evt.errors[0].stacktrace[1].inProject).toBe(true)
        expect(evt.errors[0].stacktrace[2].inProject).toBe(true)
        done()
      },
      sendSession: () => {}
    }))

    client.use(plugin)

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
    const client = new Client({ apiKey: 'api_key', projectRoot: '/app' }, {
      ...schema,
      projectRoot: {
        validate: () => true,
        defaultValue: () => '',
        message: ''
      }
    }, VALID_NOTIFIER)

    client._delivery(client => ({
      sendEvent: (payload) => {
        const evt = payload.events[0]
        expect(evt.errors[0].stacktrace[0].inProject).toBe(false)
        expect(evt.errors[0].stacktrace[1].inProject).toBe(false)
        expect(evt.errors[0].stacktrace[2].inProject).toBe(false)
        done()
      },
      sendSession: () => {}
    }))

    client.use(plugin)

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
    const client = new Client({ apiKey: 'api_key', projectRoot: '/app' }, {
      ...schema,
      projectRoot: {
        validate: () => true,
        defaultValue: () => '',
        message: ''
      }
    }, VALID_NOTIFIER)

    client._delivery(client => ({
      sendEvent: (payload) => {
        const evt = payload.events[0]
        expect(evt.errors[0].stacktrace[0].inProject).toBe(false)
        expect(evt.errors[0].stacktrace[1].inProject).toBe(false)
        done()
      },
      sendSession: () => {}
    }))

    client.use(plugin)

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
    const client = new Client({ apiKey: 'api_key', projectRoot: '/app' }, {
      ...schema,
      projectRoot: {
        validate: () => true,
        defaultValue: () => '',
        message: ''
      }
    }, VALID_NOTIFIER)

    client._delivery(client => ({
      sendEvent: (payload) => {
        const evt = payload.events[0]
        expect(evt.errors[0].stacktrace[0].inProject).toBe(false)
        expect(evt.errors[0].stacktrace[1].inProject).toBe(false)
        expect(evt.errors[0].stacktrace[2].inProject).toBe(false)
        done()
      },
      sendSession: () => {}
    }))

    client.use(plugin)

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
