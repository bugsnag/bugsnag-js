import xhrResponseParser from '../lib/xhr-response-parser'

describe('xhr-response-parser', () => {
  describe('xhrResponseParser', () => {
    it('should parse text responseType', () => {
      const xhr = {
        responseType: 'text',
        response: 'Hello World'
      }

      const result = xhrResponseParser(xhr as unknown as XMLHttpRequest)
      expect(result).toBe('Hello World')
    })

    it('should parse empty string responseType as text', () => {
      const xhr = {
        responseType: '',
        response: 'Default text response'
      }

      const result = xhrResponseParser(xhr as unknown as XMLHttpRequest)
      expect(result).toBe('Default text response')
    })

    it('should parse json responseType', () => {
      const jsonData = { key: 'value', number: 42 }
      const xhr = {
        responseType: 'json',
        response: jsonData
      }

      const result = xhrResponseParser(xhr as unknown as XMLHttpRequest)
      expect(result).toEqual(JSON.stringify(jsonData))
    })

    it('should parse arraybuffer responseType', () => {
      const buffer = new ArrayBuffer(8)
      const xhr = {
        responseType: 'arraybuffer',
        response: buffer
      }
      const result = xhrResponseParser(xhr as unknown as XMLHttpRequest)
      expect(result).toBe('[Binary Data]')
    })

    it('should parse blob responseType', () => {
      const blob = new Blob(['test'], { type: 'text/plain' })
      const xhr = {
        responseType: 'blob',
        response: blob
      }

      const result = xhrResponseParser(xhr as unknown as XMLHttpRequest)
      expect(result).toBe('[Binary Data]')
    })

    it('should parse document responseType', () => {
      const doc = document.implementation.createHTMLDocument('Test')
      const xhr = {
        responseType: 'document',
        response: doc
      }

      const result = xhrResponseParser(xhr as unknown as XMLHttpRequest)
      expect(result).toBe('[Document]')
    })

    it('should handle null response for json responseType', () => {
      const xhr = {
        responseType: 'json',
        response: null
      }

      const result = xhrResponseParser(xhr as unknown as XMLHttpRequest)
      expect(result).toBeUndefined()
    })

    it('should handle empty responseText', () => {
      const xhr = {
        responseType: 'text',
        response: ''
      }

      const result = xhrResponseParser(xhr as unknown as XMLHttpRequest)
      expect(result).toBe('')
    })

    it('should handle undefined response', () => {
      const xhr = {
        responseType: 'text',
        response: undefined
      }

      const result = xhrResponseParser(xhr as unknown as XMLHttpRequest)
      expect(result).toBeUndefined()
    })

    it('should handle null response for non-json responseType', () => {
      const xhr = {
        responseType: 'text',
        response: null
      }

      const result = xhrResponseParser(xhr as unknown as XMLHttpRequest)
      expect(result).toBeUndefined()
    })

    it('should handle unserializable JSON with circular references', () => {
      const circularObj: any = { key: 'value' }
      circularObj.self = circularObj

      const xhr = {
        responseType: 'json',
        response: circularObj
      }

      const result = xhrResponseParser(xhr as unknown as XMLHttpRequest)
      expect(result).toBe('[Unserializable JSON]')
    })

    it('should parse document with XMLDocument property', () => {
      const mockXMLDoc = document.implementation.createDocument('', 'root', null)
      const doc = {
        XMLDocument: mockXMLDoc
      }
      const xhr = {
        responseType: 'document',
        response: doc
      }

      const result = xhrResponseParser(xhr as unknown as XMLHttpRequest)
      expect(result).toContain('[Document]')
    })

    it('should handle unknown responseType as text', () => {
      const xhr = {
        responseType: 'unknown' as any,
        response: 'Fallback to text'
      }

      const result = xhrResponseParser(xhr as unknown as XMLHttpRequest)
      expect(result).toBe('Fallback to text')
    })

    it('should convert non-string response to string for text responseType', () => {
      const xhr = {
        responseType: 'text',
        response: 12345
      }

      const result = xhrResponseParser(xhr as unknown as XMLHttpRequest)
      expect(result).toBe('12345')
    })
  })
})
