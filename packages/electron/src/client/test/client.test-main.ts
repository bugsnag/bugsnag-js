import createClient from '../main'

describe('@bugsnag/electron client', () => {
  describe('createClient', () => {
    it('throws an error when an apiKey is not provided', () => {
      expect(
        () => {
          createClient({})
        }
      ).toThrowError('No Bugsnag API Key set')
    })
  })
})
