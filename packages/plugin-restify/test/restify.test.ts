import { Client } from '@bugsnag/core'
import plugin from '../src/restify'

describe('plugin: restify', () => {
  it('exports two middleware functions', () => {
    const c = new Client({ apiKey: 'api_key', plugins: [plugin] })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const middleware = c.getPlugin('restify')!
    expect(typeof middleware.requestHandler).toBe('function')
    expect(middleware.requestHandler.length).toBe(3)
    expect(typeof middleware.errorHandler).toBe('function')
    expect(middleware.errorHandler.length).toBe(4)
  })
})
