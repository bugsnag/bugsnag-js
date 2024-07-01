import Client from '@bugsnag/core/client'
import plugin from '../'

describe('plugin: react native event sync', () => {
  it('updates report state with native payload info', done => {
    const ts = new Date()
    const c = new Client({
      apiKey: 'api_key',
      plugins: [
        plugin({
          getPayloadInfoAsync: async () => {
            return {
              device: { osName: 'android', manufacturer: 'google' },
              app: { versionCode: '1.0' },
              breadcrumbs: [
                {
                  message: 'Test',
                  type: 'manual',
                  metadata: { meta: 'data' },
                  timestamp: ts.toISOString()
                }
              ],
              threads: [
                {
                  id: '123',
                  name: 'main',
                  errorReportingThread: false,
                  type: 'android',
                  stacktrace: []
                }
              ]
            }
          }
        })
      ]
    })

    c.notify(new Error('blah'), (event) => {
      expect(event.device.osName).toBe('android')
      expect(event.device.manufacturer).toBe('google')
      expect(event.app.versionCode).toBe('1.0')
      expect(event.threads.length).toBe(1)
      expect(event.threads[0].name).toBe('main')
      expect(event.breadcrumbs.length).toBe(1)
      expect(event.breadcrumbs[0].timestamp).toBe(ts.toISOString())
      done()
    })
  })

  it('uses the synchronous getPayloadInfo method when Turbo Modules are enabled', done => {
    // @ts-expect-error __turboModuleProxy does not exist on type 'Global'
    global.__turboModuleProxy = {}
    const ts = new Date()
    const c = new Client({
      apiKey: 'api_key',
      plugins: [
        plugin({
          getPayloadInfo: () => {
            return {
              device: { osName: 'android', manufacturer: 'google' },
              app: { versionCode: '1.0' },
              breadcrumbs: [
                {
                  message: 'Test',
                  type: 'manual',
                  metadata: { meta: 'data' },
                  timestamp: ts.toISOString()
                }
              ],
              threads: [
                {
                  id: '123',
                  name: 'main',
                  errorReportingThread: false,
                  type: 'android',
                  stacktrace: []
                }
              ]
            }
          }
        })
      ]
    })

    c.notify(new Error('blah'), (event) => {
      expect(event.device.osName).toBe('android')
      expect(event.device.manufacturer).toBe('google')
      expect(event.app.versionCode).toBe('1.0')
      expect(event.threads.length).toBe(1)
      expect(event.threads[0].name).toBe('main')
      expect(event.breadcrumbs.length).toBe(1)
      expect(event.breadcrumbs[0].timestamp).toBe(ts.toISOString())
      done()
    })
  })
})
