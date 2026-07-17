const RequestTracker = require('../lib/request-tracker')
const createFetchTracker = require('../lib/fetch-tracker')
const createXhrTracker = require('../lib/xhr-tracker')

// Mock environment
const mockGlobal = {
  fetch: jest.fn()
}

// Mock XMLHttpRequest
class MockXMLHttpRequest {
  constructor () {
    this.status = 200
    this.readyState = 0
    this.listeners = {}
  }

  open (method, url) {
    this.method = method
    this.url = url
  }

  send (body) {
    this.body = body
    // Simulate async request
    setTimeout(() => {
      this.readyState = 4
      this.status = 200
      this._triggerEvent('load')
    }, 0)
  }

  getAllResponseHeaders () {
    return ''
  }

  addEventListener (event, listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(listener)
  }

  removeEventListener (event, listener) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener)
    }
  }

  _triggerEvent (event, data = {}) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(data))
    }
  }

  _triggerError () {
    this._triggerEvent('error')
  }
}

// Mock global with XMLHttpRequest
const mockGlobalWithXHR = {
  XMLHttpRequest: MockXMLHttpRequest,
  WeakMap: WeakMap
}

describe('@bugsnag/request-tracker', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clean up singleton instances
    delete mockGlobal.__bugsnag_fetch_tracker__
    delete mockGlobalWithXHR.__bugsnag_xhr_tracker__

    // Reset XMLHttpRequest prototype
    mockGlobalWithXHR.XMLHttpRequest.prototype.open = MockXMLHttpRequest.prototype.open
    mockGlobalWithXHR.XMLHttpRequest.prototype.send = MockXMLHttpRequest.prototype.send
  })

  describe('RequestTracker', () => {
    it('should allow multiple callbacks to register', () => {
      const tracker = new RequestTracker()
      const callback1 = jest.fn().mockReturnValue({ onRequestEnd: jest.fn() })
      const callback2 = jest.fn().mockReturnValue({ onRequestEnd: jest.fn() })

      tracker.onStart(callback1)
      tracker.onStart(callback2)

      const context = { url: 'https://example.com', method: 'GET', startTime: Date.now() }
      tracker.start(context)

      expect(callback1).toHaveBeenCalledWith(context)
      expect(callback2).toHaveBeenCalledWith(context)
    })

    it('should handle errors in callbacks gracefully', () => {
      const tracker = new RequestTracker()
      const errorCallback = jest.fn().mockImplementation(() => { throw new Error('Test error') })
      const goodCallback = jest.fn().mockReturnValue({ onRequestEnd: jest.fn() })

      // Mock console.error to hide expected error output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      tracker.onStart(errorCallback)
      tracker.onStart(goodCallback)

      const context = { url: 'https://example.com', method: 'GET', startTime: Date.now() }
      const result = tracker.start(context)

      expect(errorCallback).toHaveBeenCalled()
      expect(goodCallback).toHaveBeenCalled()
      expect(result.onRequestEnd).toBeDefined()

      // Verify console.error was called with the expected error
      expect(consoleSpy).toHaveBeenCalledWith('RequestTracker callback error:', expect.any(Error))

      // Restore console.error
      consoleSpy.mockRestore()
    })
  })

  describe('createFetchTracker', () => {
    it('should create singleton tracker instance', () => {
      mockGlobal.fetch = jest.fn().mockResolvedValue({ status: 200 })

      const tracker1 = createFetchTracker(mockGlobal)
      const tracker2 = createFetchTracker(mockGlobal)

      expect(tracker1).toBe(tracker2)
      expect(mockGlobal.__bugsnag_fetch_tracker__).toBe(tracker1)
    })

    it('should not throw error if fetch is not available', () => {
      const globalWithoutFetch = {}
      expect(() => createFetchTracker(globalWithoutFetch)).not.toThrow()
    })

    it('should wrap fetch and call callbacks', async () => {
      const mockResponse = { status: 200 }
      mockGlobal.fetch = jest.fn().mockResolvedValue(mockResponse)

      const tracker = createFetchTracker(mockGlobal)
      const callback = jest.fn().mockReturnValue({ onRequestEnd: jest.fn() })
      tracker.onStart(callback)

      await mockGlobal.fetch('https://example.com')

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        url: 'https://example.com',
        method: 'GET',
        type: 'fetch'
      }))
    })

    it('should report headers from fetch options', async () => {
      const mockResponse = { status: 200 }
      mockGlobal.fetch = jest.fn().mockResolvedValue(mockResponse)

      const tracker = createFetchTracker(mockGlobal)
      const callback = jest.fn().mockReturnValue({ onRequestEnd: jest.fn() })
      tracker.onStart(callback)

      const headers = { 'x-token': 'super-secret-token' }
      await mockGlobal.fetch('https://example.com', { method: 'POST', headers })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        url: 'https://example.com',
        method: 'POST',
        type: 'fetch',
        headers: headers
      }))

      callback.mockClear()

      const headersObj = new Headers()
      headersObj.set('x-token', 'super-secret-token')
      await mockGlobal.fetch('https://example.com', { method: 'POST', headers: headersObj })

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        url: 'https://example.com',
        method: 'POST',
        type: 'fetch',
        headers: { 'x-token': 'super-secret-token' }
      }))
    })
  })

  describe('createXhrTracker', () => {
    it('should create singleton tracker instance', () => {
      const tracker1 = createXhrTracker(mockGlobalWithXHR)
      const tracker2 = createXhrTracker(mockGlobalWithXHR)

      expect(tracker1).toBe(tracker2)
      expect(mockGlobalWithXHR.__bugsnag_xhr_tracker__).toBe(tracker1)
    })

    it('should return undefined if XMLHttpRequest does not have addEventListener', () => {
      const globalWithoutAddEventListener = {
        XMLHttpRequest: {
          prototype: {}
        },
        WeakMap: WeakMap
      }

      const tracker = createXhrTracker(globalWithoutAddEventListener)
      expect(tracker).toBeUndefined()
    })

    it('should return undefined if WeakMap is not available', () => {
      const globalWithoutWeakMap = {
        XMLHttpRequest: {
          prototype: {
            addEventListener: () => {}
          }
        }
      }

      const tracker = createXhrTracker(globalWithoutWeakMap)
      expect(tracker).toBeUndefined()
    })

    it('should wrap XMLHttpRequest.prototype.open and send', () => {
      const originalOpen = mockGlobalWithXHR.XMLHttpRequest.prototype.open
      const originalSend = mockGlobalWithXHR.XMLHttpRequest.prototype.send

      createXhrTracker(mockGlobalWithXHR)

      expect(mockGlobalWithXHR.XMLHttpRequest.prototype.open).not.toBe(originalOpen)
      expect(mockGlobalWithXHR.XMLHttpRequest.prototype.send).not.toBe(originalSend)
    })

    it('should track XHR requests and call callbacks', async () => {
      const tracker = createXhrTracker(mockGlobalWithXHR)
      const callback = jest.fn().mockReturnValue({ onRequestEnd: jest.fn() })
      tracker.onStart(callback)

      const xhr = new mockGlobalWithXHR.XMLHttpRequest()
      xhr.open('POST', 'https://api.example.com/data')
      xhr.send('{"test": "data"}')

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        url: 'https://api.example.com/data',
        method: 'POST',
        type: 'xmlhttprequest',
        body: '{"test": "data"}'
      }))
    })

    it('should call onRequestEnd callback on successful request', async () => {
      const tracker = createXhrTracker(mockGlobalWithXHR)
      const onRequestEnd = jest.fn()
      const callback = jest.fn().mockReturnValue({ onRequestEnd })
      tracker.onStart(callback)

      const xhr = new mockGlobalWithXHR.XMLHttpRequest()
      xhr.open('GET', 'https://example.com')
      xhr.send()

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(onRequestEnd).toHaveBeenCalledWith(expect.objectContaining({
        endTime: expect.any(Number),
        status: 200,
        state: 'success',
        headers: {},
        body: undefined
      }))
    })

    it('should call onRequestEnd callback on error', async () => {
      const tracker = createXhrTracker(mockGlobalWithXHR)
      const onRequestEnd = jest.fn()
      const callback = jest.fn().mockReturnValue({ onRequestEnd })
      tracker.onStart(callback)

      const xhr = new mockGlobalWithXHR.XMLHttpRequest()
      xhr.open('GET', 'https://example.com')
      xhr.send()

      // Trigger error instead of load
      xhr._triggerError()

      expect(onRequestEnd).toHaveBeenCalledWith(expect.objectContaining({
        endTime: expect.any(Number),
        state: 'error',
        headers: {},
        body: undefined
      }))
    })

    it('should handle request data when this is undefined in open', () => {
      const tracker = createXhrTracker(mockGlobalWithXHR)
      const callback = jest.fn().mockReturnValue({ onRequestEnd: jest.fn() })
      tracker.onStart(callback)

      // The wrapper should not set anything in WeakMap when this is undefined
      // but should still call the original method (which may throw)
      const originalOpen = MockXMLHttpRequest.prototype.open
      let originalCalled = false
      MockXMLHttpRequest.prototype.open = function (method, url) {
        originalCalled = true
        // Don't call the problematic this.method = method line
      }

      mockGlobalWithXHR.XMLHttpRequest.prototype.open.call(undefined, 'GET', 'https://example.com')

      expect(originalCalled).toBe(true)
      expect(callback).not.toHaveBeenCalled() // No tracking should happen

      // Restore
      MockXMLHttpRequest.prototype.open = originalOpen
    })

    it('should handle request handlers when this is undefined in send', () => {
      const tracker = createXhrTracker(mockGlobalWithXHR)
      const callback = jest.fn().mockReturnValue({ onRequestEnd: jest.fn() })
      tracker.onStart(callback)

      // The wrapper should not set event handlers when this is undefined
      // but should still call the original method (which may throw)
      const originalSend = MockXMLHttpRequest.prototype.send
      let originalCalled = false
      MockXMLHttpRequest.prototype.send = function (body) {
        originalCalled = true
        // Don't call the problematic this.body = body line
      }

      mockGlobalWithXHR.XMLHttpRequest.prototype.send.call(undefined)

      expect(originalCalled).toBe(true)
      expect(callback).not.toHaveBeenCalled() // No tracking should happen

      // Restore
      MockXMLHttpRequest.prototype.send = originalSend
    })

    it('should remove old listeners when reusing XHR instance', async () => {
      const tracker = createXhrTracker(mockGlobalWithXHR)
      const onRequestEnd = jest.fn()
      const callback = jest.fn().mockReturnValue({ onRequestEnd })
      tracker.onStart(callback)

      const xhr = new mockGlobalWithXHR.XMLHttpRequest()

      // First request
      xhr.open('GET', 'https://example.com/1')
      xhr.send()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Reset mock to track new calls
      onRequestEnd.mockClear()

      // Second request on same instance
      xhr.open('GET', 'https://example.com/2')
      xhr.send()
      await new Promise(resolve => setTimeout(resolve, 10))

      // Should only get one callback for the second request
      expect(onRequestEnd).toHaveBeenCalledTimes(1)
      expect(onRequestEnd).toHaveBeenCalledWith(expect.objectContaining({
        state: 'success'
      }))
    })

    it('should handle method and url as non-strings gracefully', async () => {
      const tracker = createXhrTracker(mockGlobalWithXHR)
      const callback = jest.fn().mockReturnValue({ onRequestEnd: jest.fn() })
      tracker.onStart(callback)

      const xhr = new mockGlobalWithXHR.XMLHttpRequest()
      xhr.open(123, { toString: () => 'https://example.com' })
      xhr.send()

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        url: 'https://example.com',
        method: '123',
        type: 'xmlhttprequest'
      }))
    })

    it('should preserve original functionality when no request data exists', () => {
      createXhrTracker(mockGlobalWithXHR)

      const xhr = new mockGlobalWithXHR.XMLHttpRequest()
      // Don't call open, just send
      expect(() => {
        xhr.send('data')
      }).not.toThrow()
    })

    it('should include restore function in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      try {
        const tracker = createXhrTracker(mockGlobalWithXHR)
        expect(typeof tracker._restore).toBe('function')

        // Test restore functionality
        tracker._restore()

        expect(mockGlobalWithXHR.XMLHttpRequest.prototype.open).toBe(MockXMLHttpRequest.prototype.open)
        expect(mockGlobalWithXHR.XMLHttpRequest.prototype.send).toBe(MockXMLHttpRequest.prototype.send)
        expect(mockGlobalWithXHR.__bugsnag_xhr_tracker__).toBeUndefined()
      } finally {
        process.env.NODE_ENV = originalEnv
      }
    })

    it('should not include restore function in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      try {
        const tracker = createXhrTracker(mockGlobalWithXHR)
        expect(tracker._restore).toBeUndefined()
      } finally {
        process.env.NODE_ENV = originalEnv
      }
    })

    it('should handle multiple callbacks with some returning null', async () => {
      const tracker = createXhrTracker(mockGlobalWithXHR)
      const onRequestEnd1 = jest.fn()
      const onRequestEnd2 = jest.fn()

      const callback1 = jest.fn().mockReturnValue({ onRequestEnd: onRequestEnd1 })
      const callback2 = jest.fn().mockReturnValue(null) // This one returns null
      const callback3 = jest.fn().mockReturnValue({ onRequestEnd: onRequestEnd2 })

      tracker.onStart(callback1)
      tracker.onStart(callback2)
      tracker.onStart(callback3)

      const xhr = new mockGlobalWithXHR.XMLHttpRequest()
      xhr.open('GET', 'https://example.com')
      xhr.send()

      await new Promise(resolve => setTimeout(resolve, 10))

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
      expect(callback3).toHaveBeenCalled()
      expect(onRequestEnd1).toHaveBeenCalled()
      expect(onRequestEnd2).toHaveBeenCalled()
    })
  })
})
