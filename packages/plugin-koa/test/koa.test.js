const { describe, it, expect } = global

// const express = require('express')
const Client = require('@bugsnag/core/client')
const VALID_NOTIFIER = { name: 't', version: '0', url: 'http://' }
const plugin = require('../')

describe('plugin: koa', () => {
  it('exports two middleware functions', () => {
    const c = new Client({ apiKey: 'api_key' }, undefined, VALID_NOTIFIER)
    c.use(plugin)
    const middleware = c.getPlugin('koa')
    expect(typeof middleware.requestHandler).toBe('function')
    expect(middleware.requestHandler.length).toBe(2)
    expect(typeof middleware.errorHandler).toBe('function')
    expect(middleware.errorHandler.length).toBe(2)
  })

  describe('requestHandler', () => {
    it('should call through to app.onerror to ensure the error is logged out', (done) => {
      const c = new Client({ apiKey: 'api_key' }, undefined, VALID_NOTIFIER)
      c.use(plugin)
      const middleware = c.getPlugin('koa')
      const mockCtx = {
        req: { connection: { address: () => ({ port: 1234 }) }, headers: {} },
        request: { query: {} },
        res: {},
        response: { headerSent: false },
        app: { onerror: () => done() }
      }
      middleware.requestHandler(mockCtx)
    })
  })
})
