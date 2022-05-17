import plugin from '../'

import Client from '@bugsnag/core/client'

describe('plugin: throttle', () => {
  describe('addOnError', () => {
    const payloads = []
    const c = new Client({ apiKey: 'aaaa-aaaa-aaaa-aaaa' }, undefined, [plugin])
    const mockWarn = jest.fn(message => message)
    c._logger.warn = mockWarn
    c._setDelivery(client => ({ sendEvent: (payload) => payloads.push(payload), sendSession: () => {} }))

    it('prevents more than maxEvents being sent', () => {
      for (let i = 0; i < 100; i++) c.notify(new Error('This is fail'))
      expect(payloads.length).toBe(10)
      expect(mockWarn).toHaveBeenCalledTimes(90)
    })

    it('throws an appropriate error message', () => {
      expect(mockWarn.mock.results[11].value).toBe('Cancelling event send due to maxEvents per session limit of 10 being reached')
    })
  })
})
