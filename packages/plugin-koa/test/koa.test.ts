import Client from '@bugsnag/core/client'
import plugin from '../src/koa'

describe('plugin: koa', () => {
  it('exports two middleware functions', () => {
    const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
    c._sessionDelegate = {
      startSession: () => c,
      pauseSession: () => {},
      resumeSession: () => c
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const middleware = c.getPlugin('koa')!
    expect(typeof middleware.requestHandler).toBe('function')
    expect(middleware.requestHandler.length).toBe(2)
    expect(typeof middleware.errorHandler).toBe('function')
    expect(middleware.errorHandler.length).toBe(2)
  })

  describe('requestHandler', () => {
    it('should call through to app.onerror to ensure the error is logged out', (done) => {
      const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
      c._sessionDelegate = {
        startSession: () => c,
        pauseSession: () => {},
        resumeSession: () => c
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const middleware = c.getPlugin('koa')!
      const mockCtx = {
        req: { connection: { address: () => ({ port: 1234 }) }, headers: {} },
        request: { query: {} },
        res: {},
        response: { headerSent: false },
        app: {
          onerror: (err: Error) => {
            expect(err).toStrictEqual(new Error('oops'))
            done()
          }
        }
      } as any
      middleware.requestHandler(mockCtx, async () => { throw new Error('oops') })
    })
  })
})
