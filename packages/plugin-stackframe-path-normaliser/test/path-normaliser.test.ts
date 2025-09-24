import plugin from '../'
import { Client, Event } from '@bugsnag/core'

describe('plugin: stackframe path normaliser', () => {
  it('does not change frames with no file path', done => {
    const client = new Client({ apiKey: 'api_key', plugins: [plugin] })

    client._setDelivery(client => ({
      sendEvent: (payload) => {
        const event = payload.events[0]

        expect(event.errors[0].stacktrace).toHaveLength(3)

        const [frame1, frame2, frame3] = event.errors[0].stacktrace

        expect(frame1.file).toBe('global code')
        expect(frame2.file).toBe('global code')
        expect(frame3.file).toBe('global code')

        done()
      },
      sendSession: () => {}
    }))

    client._notify(new Event('Error', 'path normaliser', [
      {
        lineNumber: 22,
        columnNumber: 18,
        fileName: undefined
      },
      {
        lineNumber: 31,
        columnNumber: 7,
        fileName: undefined
      },
      {
        lineNumber: 118,
        columnNumber: 28,
        fileName: undefined
      }
    ]))
  })

  it('does not change file paths that use "/"', done => {
    const client = new Client({ apiKey: 'api_key', plugins: [plugin] })

    client._setDelivery(client => ({
      sendEvent: (payload) => {
        const event = payload.events[0]

        expect(event.errors[0].stacktrace).toHaveLength(3)

        const [frame1, frame2, frame3] = event.errors[0].stacktrace

        expect(frame1.file).toBe('/a/b/c.js')
        expect(frame2.file).toBe('/abc/def.js')
        expect(frame3.file).toBe('/abcdef/ghijkl.js')

        done()
      },
      sendSession: () => {}
    }))

    client._notify(new Event('Error', 'path normaliser', [
      {
        lineNumber: 22,
        columnNumber: 18,
        fileName: '/a/b/c.js'
      },
      {
        lineNumber: 31,
        columnNumber: 7,
        fileName: '/abc/def.js'
      },
      {
        lineNumber: 118,
        columnNumber: 28,
        fileName: '/abcdef/ghijkl.js'
      }
    ]))
  })

  it('changes file paths that use "\\" into file paths that use "/"', done => {
    const client = new Client({ apiKey: 'api_key', plugins: [plugin] })

    client._setDelivery(client => ({
      sendEvent: (payload) => {
        const event = payload.events[0]

        expect(event.errors[0].stacktrace).toHaveLength(4)

        const [frame1, frame2, frame3, frame4] = event.errors[0].stacktrace

        expect(frame1.file).toBe('/a/b/c.js')
        expect(frame2.file).toBe('/abc/def.js')
        expect(frame3.file).toBe('/abcdef/ghijkl.js')
        expect(frame4.file).toBe('/abcdefghijkl/mnopqrstuvwx.yz')

        done()
      },
      sendSession: () => {}
    }))

    client._notify(new Event('Error', 'path normaliser', [
      {
        lineNumber: 22,
        columnNumber: 18,
        fileName: '\\a\\b\\c.js'
      },
      {
        lineNumber: 31,
        columnNumber: 7,
        fileName: '\\abc\\def.js'
      },
      {
        lineNumber: 118,
        columnNumber: 28,
        fileName: '\\abcdef\\ghijkl.js'
      },
      {
        lineNumber: 2387,
        columnNumber: 192,
        fileName: '\\abcdefghijkl/mnopqrstuvwx.yz'
      }
    ]))
  })
})
