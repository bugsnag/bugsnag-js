import Client, { Delivery } from '@bugsnag/core/client'
import createPlugin from '..'
import Event from '@bugsnag/core/event'
import { Plugin } from '@bugsnag/core'

const createMockDelivery = (notifyCallbacks: Event[]) => (): Delivery => ({
  sendEvent: (payload) => {
    notifyCallbacks.push(payload.events[0])
  },
  sendSession: () => {}
})

describe('plugin-network-instrumentation', () => {
  describe('XMLHttpRequest support', () => {
    let originalXMLHttpRequest: typeof XMLHttpRequest
    let plugin: Plugin

    class MockXMLHttpRequest {
      _listeners: { load: Array<() => void>, error: Array<() => void>, loadend: Array<() => void> }
      status: number | null
      statusText: string
      responseURL: string
      response: typeof XMLHttpRequest.prototype.response
      responseType: typeof XMLHttpRequest.prototype.responseType
      _method: string
      _url: string
      _requestHeaders: Headers
      _requestBody: string | null

      constructor () {
        this._listeners = { load: [], error: [], loadend: [] }
        this.status = null
        this.statusText = ''
        this.responseURL = ''
        this.response = ''
        this.responseType = ''
        this._method = 'GET'
        this._url = ''
        this._requestHeaders = new Headers()
        this._requestBody = null
      }

      open (method: string, url: string) {
        this._method = method
        this._url = url
        this.responseURL = url
      }

      send (body?: string | null) {
        this._requestBody = body || null
        // Simulate async request completion
        setTimeout(() => {
          this._listeners.load.forEach(fn => fn())
          this._listeners.loadend.forEach(fn => fn())
        }, 0)
      }

      setRequestHeader (name: string, value: string) {
        this._requestHeaders.set(name.toLowerCase(), value)
      }

      addEventListener (evt: 'load' | 'error' | 'loadend', listener: () => void) {
        this._listeners[evt]?.push(listener)
      }

      removeEventListener (evt: 'load' | 'error' | 'loadend', listener: () => void) {
        const listeners = this._listeners[evt]
        if (listeners) {
          const index = listeners.indexOf(listener)
          if (index >= 0) {
            listeners.splice(index, 1)
          }
        }
      }

      getAllResponseHeaders () {
        return 'content-type: application/json\r\ncontent-length: 45\r\n'
      }

      // Helper method to simulate error responses
      simulateError () {
        setTimeout(() => {
          this._listeners.error.forEach(fn => fn())
          this._listeners.loadend.forEach(fn => fn())
        }, 0)
      }
    }

    beforeEach(() => {
      originalXMLHttpRequest = global.XMLHttpRequest
      global.XMLHttpRequest = MockXMLHttpRequest as any
    })

    afterEach(() => {
      global.XMLHttpRequest = originalXMLHttpRequest
      plugin.destroy?.()
    })

    it('should capture XHR errors with response body and body length', async () => {
      const notifyCallbacks: Event[] = []

      plugin = createPlugin({
        httpErrorCodes: { min: 400, max: 499 },
        maxRequestSize: 1000,
        maxResponseSize: 1000
      })

      const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
      client._setDelivery(createMockDelivery(notifyCallbacks))

      // Create and configure XHR instance
      const xhr = new XMLHttpRequest() as any
      xhr.status = 404
      xhr.statusText = 'Not Found'
      xhr.responseURL = 'https://api.example.com/users/123'
      xhr.response = '{"error": "User not found", "code": "USER_NOT_FOUND"}'
      xhr.responseType = 'json'

      // Simulate an XHR request
      xhr.open('POST', 'https://api.example.com/users/123')
      xhr.setRequestHeader('Content-Type', 'application/json')

      // Send request with body
      const requestBody = '{"name": "John Doe", "email": "john@example.com"}'
      xhr.send(requestBody)

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 20))

      expect(notifyCallbacks.length).toBe(1)
      const event = notifyCallbacks[0].toJSON()

      // Verify error details
      expect(event.exceptions[0].errorClass).toBe('HTTPError')
      expect(event.exceptions[0].errorMessage).toBe('404: https://api.example.com/users/123')
      expect(event.exceptions[0].stacktrace).toEqual([]) // Stacktrace should be empty for HTTP errors
      expect(event.context).toBe('POST api.example.com')
      expect(event.severity).toBe('error')
      expect(event.unhandled).toBe(false)
      expect(event.severityReason.type).toBe('httpError')

      // Verify request metadata
      expect(event.request.url).toBe('https://api.example.com/users/123')
      expect(event.request.httpMethod).toBe('POST')
      expect(event.request.body).toBe(requestBody)
      expect(event.request.bodyLength).toBe(requestBody.length)
      expect(event.request.headers).toStrictEqual({ 'Content-Type': 'application/json' })

      // Verify response metadata including body
      expect(event.response.statusCode).toBe(404)
      expect(event.response.headers['content-type']).toBe('application/json')
      expect(event.response.headers['content-length']).toBe('45')
      expect(event.response.body).toBe(JSON.stringify(xhr.response))
      expect(event.response.bodyLength).toBe(JSON.stringify(xhr.response).length)
    })

    it('should truncate XHR response body when it exceeds maxResponseSize', async () => {
      const notifyCallbacks: Event[] = []

      plugin = createPlugin({
        httpErrorCodes: { min: 400, max: 499 },
        maxResponseSize: 20
      })

      const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
      client._setDelivery(createMockDelivery(notifyCallbacks))

      // Create and configure XHR with large response body
      const xhr = new XMLHttpRequest() as any
      const largeResponseBody = 'A'.repeat(100)
      xhr.status = 404
      xhr.statusText = 'Internal Server Error'
      xhr.responseURL = 'https://api.example.com/error'
      xhr.response = largeResponseBody

      xhr.open('GET', 'https://api.example.com/error')
      xhr.send()

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 20))

      expect(notifyCallbacks.length).toBe(1)
      const event = notifyCallbacks[0].toJSON()

      // Verify response body is truncated but original length is preserved
      expect(event.response.body?.length).toBeLessThanOrEqual(20)
      expect(event.response.bodyLength).toBe(100)
    })

    it('should handle XHR network errors', async () => {
      const notifyCallbacks: Event[] = []

      plugin = createPlugin({
        httpErrorCodes: { min: 400, max: 499 }
      })

      const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
      client._setDelivery(createMockDelivery(notifyCallbacks))

      const xhr = new XMLHttpRequest() as any
      xhr.open('GET', 'https://api.example.com/error')
      xhr.send()

      // Simulate a network error
      xhr.simulateError()

      await new Promise(resolve => setTimeout(resolve, 20))

      // Network errors typically don't generate HTTP error events in this plugin
      // since they don't have status codes, but let's verify the behavior
      expect(notifyCallbacks.length).toBe(0)
    })

    it('should redact specified query parameters in XHR URLs', async () => {
      const notifyCallbacks: Event[] = []

      plugin = createPlugin({
        httpErrorCodes: { min: 400, max: 499 }
      })

      const client = new Client({ apiKey: 'api_key', plugins: [plugin], redactedKeys: ['token', 'userId'] })
      client._setDelivery(createMockDelivery(notifyCallbacks))

      const xhr = new XMLHttpRequest() as any
      xhr.status = 403
      xhr.statusText = 'Forbidden'
      xhr.response = 'Forbidden'

      xhr.open('GET', 'https://api.example.com/data?userId=42')
      xhr.send()

      await new Promise(resolve => setTimeout(resolve, 20))

      expect(notifyCallbacks.length).toBe(1)
      const event = notifyCallbacks[0].toJSON()

      // Verify that sensitive query parameters are redacted
      expect(event.request.url).toBe('https://api.example.com/data?userId=[REDACTED]')
    })
  })
})
