import Client from '@bugsnag/core/client'
import createPlugin from '..'
import Event from '@bugsnag/core/event'

// Mock fetch globally
const originalFetch = global.fetch

// Helper to create mock response with clone method
const createMockResponse = (options: any) => {
    const response = {
        ok: options.ok !== undefined ? options.ok : true,
        status: options.status || 200,
        statusText: options.statusText || 'OK',
        url: options.url || '',
        headers: options.headers || new Headers(),
        text: options.text || (async () => ''),
        clone: function() {
            return { ...this }
        }
    }
    return response
}

describe('plugin-http-errors', () => {
    let mockFetch: jest.Mock
    
    beforeEach(() => {
        mockFetch = jest.fn()
        global.fetch = mockFetch
    })
    
    afterEach(() => {
        global.fetch = originalFetch
        jest.clearAllMocks()
    })

    describe('plugin configuration', () => {
        it('should export a plugin with name and load function', () => {
            const plugin = createPlugin()
            expect(plugin.name).toBe('httpErrors')
            expect(typeof plugin.load).toBe('function')
        })

        it('should load without configuration', () => {
            const plugin = createPlugin()
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            expect(client).toBeDefined()
        })
    })

    describe('config.httpErrorCodes - single range', () => {
        it('should capture 4xx errors when configured with single range', async () => {
            const notifyCallbacks: Event[] = []
            
            const plugin = createPlugin({
                httpErrorCodes: { min: 400, max: 499 }
            })
            
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            client._setDelivery(() => ({
                sendEvent: (payload) => {
                    notifyCallbacks.push(payload.events[0])
                },
                sendSession: () => {}
            }))

            mockFetch.mockResolvedValue(createMockResponse({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                url: 'https://example.com/api/users',
                headers: new Headers({ 'content-type': 'application/json' }),
                text: async () => '{"error": "User not found"}'
            }))

            await fetch('https://example.com/api/users')

            // Wait for async processing
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(notifyCallbacks.length).toBe(1)
            const event = notifyCallbacks[0].toJSON()

            expect(event.exceptions[0].errorClass).toBe('HTTPError')
            expect(event.exceptions[0].errorMessage).toBe('404: https://example.com/api/users')
            expect(event.context).toBe('GET example.com')
            expect(event.severity).toBe('error')
            expect(event.unhandled).toBe(true)
            expect(event.severityReason.type).toBe('httpError')
            expect(event.request.url).toBe('https://example.com/api/users')
            expect(event.request.httpMethod).toBe('GET')
            expect(event.response.statusCode).toBe(404)
            expect(event.response.headers['content-type']).toBe('application/json')
        })

        it('should not capture 2xx successful responses', async () => {
            const notifyCallbacks: Event[] = []
            
            const plugin = createPlugin({
                httpErrorCodes: { min: 400, max: 499 }
            })
            
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            client._setDelivery(() => ({
                sendEvent: (payload) => {
                    notifyCallbacks.push(payload.events[0])
                },
                sendSession: () => {}
            }))

            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                url: 'https://example.com/api/users',
                headers: new Headers(),
                text: async () => '{"success": true}'
            })

            await fetch('https://example.com/api/users')
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(notifyCallbacks.length).toBe(0)
        })

        it('should not capture 5xx errors when configured for 4xx only', async () => {
            const notifyCallbacks: Event[] = []
            
            const plugin = createPlugin({
                httpErrorCodes: { min: 400, max: 499 }
            })
            
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            client._setDelivery(() => ({
                sendEvent: (payload) => {
                    notifyCallbacks.push(payload.events[0])
                },
                sendSession: () => {}
            }))

            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                url: 'https://example.com/api/error',
                headers: new Headers(),
                text: async () => 'Server error'
            })

            await fetch('https://example.com/api/error')
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(notifyCallbacks.length).toBe(0)
        })
    })

    describe('config.httpErrorCodes - multiple ranges and specific codes', () => {
        it('should capture errors matching any range or specific code', async () => {
            const notifyCallbacks: Event[] = []
            
            const plugin = createPlugin({
                httpErrorCodes: [{ min: 400, max: 499 }, 500, 503]
            })
            
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            client._setDelivery(() => ({
                sendEvent: (payload) => {
                    notifyCallbacks.push(payload.events[0])
                },
                sendSession: () => {}
            }))

            // Test 404 (in range)
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                url: 'https://example.com/api/users',
                headers: new Headers(),
                text: async () => 'Not found'
            })
            await fetch('https://example.com/api/users')
            await new Promise(resolve => setTimeout(resolve, 10))

            // Test 500 (specific code)
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                url: 'https://example.com/api/error',
                headers: new Headers(),
                text: async () => 'Server error'
            })
            await fetch('https://example.com/api/error')
            await new Promise(resolve => setTimeout(resolve, 10))

            // Test 503 (specific code)
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 503,
                statusText: 'Service Unavailable',
                url: 'https://example.com/api/service',
                headers: new Headers(),
                text: async () => 'Service unavailable'
            })
            await fetch('https://example.com/api/service')
            await new Promise(resolve => setTimeout(resolve, 10))

            // Test 502 (not in list)
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 502,
                statusText: 'Bad Gateway',
                url: 'https://example.com/api/gateway',
                headers: new Headers(),
                text: async () => 'Bad gateway'
            })
            await fetch('https://example.com/api/gateway')
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(notifyCallbacks.length).toBe(3)
            expect(notifyCallbacks[0].errors[0].errorMessage).toContain('404')
            expect(notifyCallbacks[1].errors[0].errorMessage).toContain('500')
            expect(notifyCallbacks[2].errors[0].errorMessage).toContain('503')
        })
    })

    describe('config.httpErrorCodes - default behavior', () => {
        it('should capture all 4xx and 5xx errors by default', async () => {
            const notifyCallbacks: Event[] = []
            
            const plugin = createPlugin() // No config
            
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            client._setDelivery(() => ({
                sendEvent: (payload) => {
                    notifyCallbacks.push(payload.events[0])
                },
                sendSession: () => {}
            }))

            // Test 404
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                url: 'https://example.com/api/users',
                headers: new Headers(),
                text: async () => 'Not found'
            })
            await fetch('https://example.com/api/users')
            await new Promise(resolve => setTimeout(resolve, 10))

            // Test 500
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                url: 'https://example.com/api/error',
                headers: new Headers(),
                text: async () => 'Server error'
            })
            await fetch('https://example.com/api/error')
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(notifyCallbacks.length).toBe(2)
        })
    })

    describe('config.maxResponseSize', () => {
        it('should truncate response body when it exceeds maxResponseSize', async () => {
            const notifyCallbacks: Event[] = []
            
            const plugin = createPlugin({
                httpErrorCodes: { min: 400, max: 499 },
                maxResponseSize: 50
            })
            
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            client._setDelivery(() => ({
                sendEvent: (payload) => {
                    notifyCallbacks.push(payload.events[0])
                },
                sendSession: () => {}
            }))

            const largeBody = 'A'.repeat(100)
            mockFetch.mockResolvedValue({
                ok: false,
                status: 404,
                url: 'https://example.com/api/users',
                headers: new Headers({ 'content-type': 'text/plain' }),
                text: async () => largeBody
            })

            await fetch('https://example.com/api/users')
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(notifyCallbacks.length).toBe(1)
            const event = notifyCallbacks[0].toJSON()
            const responseMetadata = event.response
            
            expect(responseMetadata.body?.length).toBeLessThanOrEqual(50)
            expect(responseMetadata.bodyLength).toBe(100)
        })

        it('should include full response body when under maxResponseSize', async () => {
            const notifyCallbacks: Event[] = []
            
            const plugin = createPlugin({
                httpErrorCodes: { min: 400, max: 499 },
                maxResponseSize: 100
            })
            
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            client._setDelivery(() => ({
                sendEvent: (payload) => {
                    notifyCallbacks.push(payload.events[0])
                },
                sendSession: () => {}
            }))

            const smallBody = '{"error": "Not found"}'
            mockFetch.mockResolvedValue({
                ok: false,
                status: 404,
                url: 'https://example.com/api/users',
                headers: new Headers({ 'content-type': 'application/json' }),
                text: async () => smallBody
            })

            await fetch('https://example.com/api/users')
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(notifyCallbacks.length).toBe(1)
            const event = notifyCallbacks[0].toJSON()
            const responseMetadata = event.response
            
            expect(responseMetadata.body).toBe(smallBody)
            expect(responseMetadata.bodyLength).toBe(smallBody.length)
        })

        it('should use default maxResponseSize of 20000 when not specified', async () => {
            const notifyCallbacks: Event[] = []
            
            const plugin = createPlugin({
                httpErrorCodes: { min: 400, max: 499 }
            })
            
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            client._setDelivery(() => ({
                sendEvent: (payload) => {
                    notifyCallbacks.push(payload.events[0])
                },
                sendSession: () => {}
            }))

            const largeBody = 'B'.repeat(25000)
            mockFetch.mockResolvedValue({
                ok: false,
                status: 404,
                url: 'https://example.com/api/users',
                headers: new Headers(),
                text: async () => largeBody
            })

            await fetch('https://example.com/api/users')
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(notifyCallbacks.length).toBe(1)
            const event = notifyCallbacks[0].toJSON()
            const responseMetadata = event.response
            
            expect(responseMetadata.body?.length).toBeLessThanOrEqual(20000)
            expect(responseMetadata.bodyLength).toBe(25000)
        })
    })

    describe('config.maxRequestSize', () => {
        it('should truncate request body when it exceeds maxRequestSize', async () => {
            const notifyCallbacks: Event[] = []
            
            const plugin = createPlugin({
                httpErrorCodes: { min: 400, max: 499 },
                maxRequestSize: 50
            })
            
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            client._setDelivery(() => ({
                sendEvent: (payload) => {
                    notifyCallbacks.push(payload.events[0])
                },
                sendSession: () => {}
            }))

            const largeRequestBody = 'C'.repeat(100)
            mockFetch.mockResolvedValue({
                ok: false,
                status: 400,
                url: 'https://example.com/api/users',
                headers: new Headers(),
                text: async () => 'Bad request'
            })

            await fetch('https://example.com/api/users', {
                method: 'POST',
                body: largeRequestBody
            })
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(notifyCallbacks.length).toBe(1)
            const event = notifyCallbacks[0].toJSON()
            const requestMetadata = event.request
            
            expect(requestMetadata.body.length).toBeLessThanOrEqual(50)
            expect(requestMetadata.bodyLength).toBe(100)
        })

        it('should use default maxRequestSize of 5000 when not specified', async () => {
            const notifyCallbacks: Event[] = []
            
            const plugin = createPlugin({
                httpErrorCodes: { min: 400, max: 499 }
            })
            
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            client._setDelivery(() => ({
                sendEvent: (payload) => {
                    notifyCallbacks.push(payload.events[0])
                },
                sendSession: () => {}
            }))

            const largeRequestBody = 'D'.repeat(10000)
            mockFetch.mockResolvedValue({
                ok: false,
                status: 400,
                url: 'https://example.com/api/users',
                headers: new Headers(),
                text: async () => 'Bad request'
            })

            await fetch('https://example.com/api/users', {
                method: 'POST',
                body: largeRequestBody
            })
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(notifyCallbacks.length).toBe(1)
            const event = notifyCallbacks[0]
            const requestMetadata = event.request
            
            expect(requestMetadata.body.length).toBeLessThanOrEqual(5000)
            expect(requestMetadata.bodyLength).toBe(10000)
        })
    })

    describe('config.onHttpError callback', () => {
        it('should call onHttpError callback with request and response objects', async () => {
            const onHttpError = jest.fn()
            const notifyCallbacks: Event[] = []
            
            const plugin = createPlugin({
                httpErrorCodes: { min: 400, max: 499 },
                onHttpError
            })
            
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            client._setDelivery(() => ({
                sendEvent: (payload) => {
                    notifyCallbacks.push(payload.events[0])
                },
                sendSession: () => {}
            }))

            mockFetch.mockResolvedValue({
                ok: false,
                status: 404,
                url: 'https://example.com/api/users',
                headers: new Headers(),
                text: async () => 'Not found'
            })

            await fetch('https://example.com/api/users')
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(onHttpError).toHaveBeenCalled()
            const callArg = onHttpError.mock.calls[0][0]
            expect(callArg.request).toBeDefined()
            expect(callArg.request.url).toBe('https://example.com/api/users')
            expect(callArg.response).toBeDefined()
            expect(callArg.response.statusCode).toBe(404)
        })

        it('should prevent event creation when onHttpError returns false', async () => {
            const notifyCallbacks: Event[] = []
            
            const plugin = createPlugin({
                httpErrorCodes: { min: 400, max: 499 },
                onHttpError: ({ request }) => {
                    // Filter out requests with PII
                    if (request.url?.includes('PII')) return false
                    return true
                }
            })
            
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            client._setDelivery(() => ({
                sendEvent: (payload) => {
                    notifyCallbacks.push(payload.events[0])
                },
                sendSession: () => {}
            }))

            // Request with PII - should be filtered
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                url: 'https://example.com/api/users/PII/data',
                headers: new Headers(),
                text: async () => 'Not found'
            })
            await fetch('https://example.com/api/users/PII/data')
            await new Promise(resolve => setTimeout(resolve, 10))

            // Normal request - should go through
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                url: 'https://example.com/api/users',
                headers: new Headers(),
                text: async () => 'Not found'
            })
            await fetch('https://example.com/api/users')
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(notifyCallbacks.length).toBe(1)
            expect(notifyCallbacks[0].errors[0].errorMessage).not.toContain('PII')
        })

        it('should allow onHttpError to modify request and response', async () => {
            const notifyCallbacks: Event[] = []
            
            const plugin = createPlugin({
                httpErrorCodes: { min: 400, max: 499 },
                onHttpError: ({ request, response }) => {
                    // Redact sensitive information
                    request.url = '[REDACTED]'
                    response.statusCode = 418
                    return true
                }
            })
            
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            client._setDelivery(() => ({
                sendEvent: (payload) => {
                    notifyCallbacks.push(payload.events[0])
                },
                sendSession: () => {}
            }))

            mockFetch.mockResolvedValue({
                ok: false,
                status: 404,
                url: 'https://example.com/api/users',
                headers: new Headers(),
                text: async () => 'Not found'
            })

            await fetch('https://example.com/api/users')
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(notifyCallbacks.length).toBe(1)
            const event = notifyCallbacks[0].toJSON()
            const requestMetadata = event.request
            const responseMetadata = event.response
            
            expect(requestMetadata.url).toBe('[REDACTED]')
            expect(responseMetadata.statusCode).toBe(418)
        })

        it('should filter errors by status code in onHttpError', async () => {
            const notifyCallbacks: Event[] = []
            
            const plugin = createPlugin({
                httpErrorCodes: [{ min: 400, max: 599 }],
                onHttpError: ({ response }) => {
                    // Only handle 5xx errors
                    if (response.statusCode < 500 || response.statusCode > 599) return false
                    return true
                }
            })
            
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            client._setDelivery(() => ({
                sendEvent: (payload) => {
                    notifyCallbacks.push(payload.events[0])
                },
                sendSession: () => {}
            }))

            // Test 4xx - should be filtered
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                url: 'https://example.com/api/users',
                headers: new Headers(),
                text: async () => 'Not found'
            })
            await fetch('https://example.com/api/users')
            await new Promise(resolve => setTimeout(resolve, 10))

            // Test 5xx - should be captured
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                url: 'https://example.com/api/error',
                headers: new Headers(),
                text: async () => 'Server error'
            })
            await fetch('https://example.com/api/error')
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(notifyCallbacks.length).toBe(1)
            expect(notifyCallbacks[0].response.statusCode).toBe(500)
        })
    })

    describe('event data validation', () => {
        it('should populate event.errors with correct structure', async () => {
            const notifyCallbacks: Event[] = []
            
            const plugin = createPlugin({
                httpErrorCodes: { min: 400, max: 499 }
            })
            
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            client._setDelivery(() => ({
                sendEvent: (payload) => {
                    notifyCallbacks.push(payload.events[0])
                },
                sendSession: () => {}
            }))

            mockFetch.mockResolvedValue({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                url: 'https://example.com/api/users/123',
                headers: new Headers(),
                text: async () => 'Not found'
            })

            await fetch('https://example.com/api/users/123')
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(notifyCallbacks.length).toBe(1)
            const event = notifyCallbacks[0]
            
            expect(event.errors).toHaveLength(1)
            expect(event.errors[0].errorClass).toBe('HTTPError')
            expect(event.errors[0].errorMessage).toBe('404: https://example.com/api/users/123')
        })

        it('should set event.context to method and domain', async () => {
            const notifyCallbacks: Event[] = []
            
            const plugin = createPlugin({
                httpErrorCodes: { min: 400, max: 499 }
            })
            
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            client._setDelivery(() => ({
                sendEvent: (payload) => {
                    notifyCallbacks.push(payload.events[0])
                },
                sendSession: () => {}
            }))

            mockFetch.mockResolvedValue({
                ok: false,
                status: 404,
                url: 'https://example.com/api/users',
                headers: new Headers(),
                text: async () => 'Not found'
            })

            await fetch('https://example.com/api/users', { method: 'POST' })
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(notifyCallbacks.length).toBe(1)
            const event = notifyCallbacks[0]
            expect(event.context).toBe('POST example.com')
        })

        it('should populate request metadata with all fields', async () => {
            const notifyCallbacks: Event[] = []
            
            const plugin = createPlugin({
                httpErrorCodes: { min: 400, max: 499 }
            })
            
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            client._setDelivery(() => ({
                sendEvent: (payload) => {
                    notifyCallbacks.push(payload.events[0])
                },
                sendSession: () => {}
            }))

            mockFetch.mockResolvedValue({
                ok: false,
                status: 400,
                url: 'https://example.com/api/users?page=1&limit=10',
                headers: new Headers(),
                text: async () => 'Bad request'
            })

            await fetch('https://example.com/api/users?page=1&limit=10', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer token' },
                body: JSON.stringify({ name: 'John' })
            })
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(notifyCallbacks.length).toBe(1)
            const event = notifyCallbacks[0].toJSON()
            const requestMetadata = event.request
            
            expect(requestMetadata.url).toBe('https://example.com/api/users?page=1&limit=10')
            expect(requestMetadata.httpMethod).toBe('POST')
            expect(requestMetadata.headers).toBeDefined()
            expect(requestMetadata.headers?.['content-type']).toBe('application/json')
            expect(requestMetadata.params).toBeDefined()
            expect(requestMetadata.params.page).toBe('1')
            expect(requestMetadata.params.limit).toBe('10')
            expect(requestMetadata.body).toBeDefined()
            expect(requestMetadata.bodyLength).toBeDefined()
        })

        it('should populate response metadata with all fields', async () => {
            const notifyCallbacks: Event[] = []
            
            const plugin = createPlugin({
                httpErrorCodes: { min: 400, max: 499 }
            })
            
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            client._setDelivery(() => ({
                sendEvent: (payload) => {
                    notifyCallbacks.push(payload.events[0])
                },
                sendSession: () => {}
            }))

            const responseBody = '{"error": "Invalid input"}'
            mockFetch.mockResolvedValue({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                url: 'https://example.com/api/users',
                headers: new Headers({
                    'content-type': 'application/json',
                    'x-request-id': '12345'
                }),
                text: async () => responseBody
            })

            await fetch('https://example.com/api/users')
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(notifyCallbacks.length).toBe(1)
            const event = notifyCallbacks[0]
            const responseMetadata = event.response
            
            expect(responseMetadata.statusCode).toBe(400)
            expect(responseMetadata.headers).toBeDefined()
            expect(responseMetadata.headers['content-type']).toBe('application/json')
            expect(responseMetadata.headers['x-request-id']).toBe('12345')
            expect(responseMetadata.body).toBe(responseBody)
            expect(responseMetadata.bodyLength).toBe(responseBody.length)
        })

        it('should handle requests with different HTTP methods', async () => {
            const notifyCallbacks: Event[] = []
            
            const plugin = createPlugin({
                httpErrorCodes: { min: 400, max: 499 }
            })
            
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            client._setDelivery(() => ({
                sendEvent: (payload) => {
                    notifyCallbacks.push(payload.events[0])
                },
                sendSession: () => {}
            }))

            const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
            
            for (const method of methods) {
                mockFetch.mockResolvedValueOnce({
                    ok: false,
                    status: 404,
                    url: 'https://example.com/api/resource',
                    headers: new Headers(),
                    text: async () => 'Not found'
                })

                await fetch('https://example.com/api/resource', { method })
                await new Promise(resolve => setTimeout(resolve, 10))
            }

            expect(notifyCallbacks.length).toBe(methods.length)
            methods.forEach((method, index) => {
                const requestMetadata = notifyCallbacks[index].request
                expect(requestMetadata.httpMethod).toBe(method)
                expect(notifyCallbacks[index].context).toBe(`${method} example.com`)
            })
        })

        it('should handle URLs with ports', async () => {
            const notifyCallbacks: Event[] = []
            
            const plugin = createPlugin({
                httpErrorCodes: { min: 400, max: 499 }
            })
            
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            client._setDelivery(() => ({
                sendEvent: (payload) => {
                    notifyCallbacks.push(payload.events[0])
                },
                sendSession: () => {}
            }))

            mockFetch.mockResolvedValue({
                ok: false,
                status: 404,
                url: 'https://example.com:8080/api/users',
                headers: new Headers(),
                text: async () => 'Not found'
            })

            await fetch('https://example.com:8080/api/users')
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(notifyCallbacks.length).toBe(1)
            const event = notifyCallbacks[0]
            expect(event.context).toBe('GET example.com')
            expect(event.errors[0].errorMessage).toBe('404: https://example.com:8080/api/users')
        })

        it('should handle requests without query parameters', async () => {
            const notifyCallbacks: Event[] = []
            
            const plugin = createPlugin({
                httpErrorCodes: { min: 400, max: 499 }
            })
            
            const client = new Client({ apiKey: 'api_key', plugins: [plugin] })
            client._setDelivery(() => ({
                sendEvent: (payload) => {
                    notifyCallbacks.push(payload.events[0])
                },
                sendSession: () => {}
            }))

            mockFetch.mockResolvedValue({
                ok: false,
                status: 404,
                url: 'https://example.com/api/users',
                headers: new Headers(),
                text: async () => 'Not found'
            })

            await fetch('https://example.com/api/users')
            await new Promise(resolve => setTimeout(resolve, 10))

            expect(notifyCallbacks.length).toBe(1)
            const event = notifyCallbacks[0].toJSON()
            const requestMetadata = event.request
            expect(requestMetadata.params).toEqual({})
        })
    })
})
