const { describe, it, expect } = global

const fs = require('fs')
let createReadStreamCount = 0
const originalReadStream = fs.createReadStream
fs.createReadStream = function () {
  createReadStreamCount++
  return originalReadStream.apply(fs, arguments)
}

const plugin = require('../')
const { join } = require('path')
const Event = require('@bugsnag/core/event')
const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }

describe('plugin: node surrounding code', () => {
  it('should load code successfully for stackframes whose files exist', done => {
    const client = new Client({ apiKey: 'api_key' }, undefined, VALID_NOTIFIER)

    client._delivery(client => ({
      sendEvent: (report) => {
        const evt = report.events[0]
        expect(Object.keys(evt.errors[0].stacktrace[0].code))
          .toEqual(['19', '20', '21', '22', '23', '24', '25'])
        expect(evt.errors[0].stacktrace[0].code['22'])
          .toBe('    if (cb) this.on(\'finish\', () => cb(this.output()))')

        expect(Object.keys(evt.errors[0].stacktrace[1].code))
          .toEqual(['28', '29', '30', '31', '32', '33', '34'])
        expect(evt.errors[0].stacktrace[1].code['31'])
          .toBe('      return nextLevelUp()')

        expect(Object.keys(evt.errors[0].stacktrace[2].code))
          .toEqual(['115', '116', '117', '118', '119', '120', '121'])
        expect(evt.errors[0].stacktrace[2].code['118'])
          .toBe('  \'Ķ\': \'k\', \'Ļ\': \'L\', \'Ņ\': \'N\', \'Ū\': \'u\'')

        done()
      },
      sendSession: () => {}
    }))

    client.use(plugin)

    client._notify(new Event('Error', 'surrounding code loading test', [
      {
        lineNumber: 22,
        columnNumber: 18,
        fileName: join(__dirname, 'fixtures', '01.js')
      }, {
        lineNumber: 31,
        columnNumber: 7,
        fileName: join(__dirname, 'fixtures', '02.js')
      }, {
        lineNumber: 118,
        columnNumber: 28,
        fileName: join(__dirname, 'fixtures', '03.js')
      }
    ]))
  })

  it('should tolerate missing files for some stackframes', done => {
    const client = new Client({ apiKey: 'api_key' }, undefined, VALID_NOTIFIER)

    client._delivery(client => ({
      sendEvent: (report) => {
        const evt = report.events[0]
        expect(evt.errors[0].stacktrace[0].code).toBeTruthy()
        expect(evt.errors[0].stacktrace[1].code).toBeUndefined()
        expect(evt.errors[0].stacktrace[2].code).toBeTruthy()
        done()
      },
      sendSession: () => {}
    }))

    client.use(plugin)

    client._notify(new Event('Error', 'surrounding code loading test', [
      {
        lineNumber: 22,
        columnNumber: 18,
        fileName: join(__dirname, 'fixtures', '01.js')
      }, {
        lineNumber: 31,
        columnNumber: 7,
        fileName: join(__dirname, 'fixtures', '0000000.js')
      }, {
        lineNumber: 118,
        columnNumber: 28,
        fileName: join(__dirname, 'fixtures', '03.js')
      }
    ]))
  })

  it('behaves sensibly for code at the beginning and end of a file', done => {
    const client = new Client({ apiKey: 'api_key' }, undefined, VALID_NOTIFIER)

    client._delivery(client => ({
      sendEvent: (report) => {
        const evt = report.events[0]
        expect(evt.errors[0].stacktrace[0].code).toEqual({
          1: '// this is just some arbitrary (but real) javascript for testing, taken from',
          2: '// https://github.com/bengourley/source-map-decoder/',
          3: '',
          4: '//'
        })
        expect(evt.errors[0].stacktrace[1].code).toEqual({
          42: '  return findFile(root, filename)',
          43: '',
          44: '}',
          45: ''
        })
        done()
      },
      sendSession: () => {}
    }))

    client.use(plugin)

    client._notify(new Event('Error', 'surrounding code loading test', [
      {
        lineNumber: 1,
        columnNumber: 1,
        fileName: join(__dirname, 'fixtures', '01.js')
      },
      {
        lineNumber: 45,
        columnNumber: 1,
        fileName: join(__dirname, 'fixtures', '02.js')
      }
    ]))
  })

  it('only loads code once for the same file/line/column', done => {
    const client = new Client({ apiKey: 'api_key' }, undefined, VALID_NOTIFIER)

    const startCount = createReadStreamCount

    client._delivery(client => ({
      sendEvent: (report) => {
        const endCount = createReadStreamCount
        expect(endCount - startCount).toBe(1)
        report.events[0].errors[0].stacktrace.forEach(stackframe => {
          expect(stackframe.code).toEqual({
            1: '// this is just some arbitrary (but real) javascript for testing, taken from',
            2: '// https://github.com/bengourley/source-map-decoder/',
            3: '',
            4: '//'
          })
        })
        done()
      },
      sendSession: () => {}
    }))

    client.use(plugin)

    client._notify(new Event('Error', 'surrounding code loading test', [
      {
        lineNumber: 1,
        columnNumber: 1,
        fileName: join(__dirname, 'fixtures', '01.js')
      },
      {
        lineNumber: 1,
        columnNumber: 1,
        fileName: join(__dirname, 'fixtures', '01.js')
      },
      {
        lineNumber: 1,
        columnNumber: 1,
        fileName: join(__dirname, 'fixtures', '01.js')
      },
      {
        lineNumber: 1,
        columnNumber: 1,
        fileName: join(__dirname, 'fixtures', '01.js')
      },
      {
        lineNumber: 1,
        columnNumber: 1,
        fileName: join(__dirname, 'fixtures', '01.js')
      },
      {
        lineNumber: 1,
        columnNumber: 1,
        fileName: join(__dirname, 'fixtures', '01.js')
      },
      {
        lineNumber: 1,
        columnNumber: 1,
        fileName: join(__dirname, 'fixtures', '01.js')
      },
      {
        lineNumber: 1,
        columnNumber: 1,
        fileName: join(__dirname, 'fixtures', '01.js')
      }
    ]))
  })

  it('truncates lines to a sensible number of characters', done => {
    const client = new Client({ apiKey: 'api_key' }, undefined, VALID_NOTIFIER)

    client._delivery(client => ({
      sendEvent: (report) => {
        report.events[0].errors[0].stacktrace.forEach(stackframe => {
          Object.keys(stackframe.code).forEach(key => {
            expect(stackframe.code[key].length <= 200).toBe(true)
          })
        })
        done()
      },
      sendSession: () => {}
    }))

    client.use(plugin)

    client._notify(new Event('Error', 'surrounding code loading test', [
      {
        lineNumber: 1,
        columnNumber: 1,
        fileName: join(__dirname, 'fixtures', '04.js')
      }
    ]))
  })
})
