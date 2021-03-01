import serializeConfigForRenderer from '../config-serializer'

describe('serializeConfigForRenderer() method', () => {
  it('doesn’t serialize unwanted config options', () => {
    expect(JSON.parse(serializeConfigForRenderer({
      apiKey: '123',
      logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
      plugins: [{ load: () => {} }]
    }))).toEqual({
      apiKey: '123'
    })
  })
})
