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
  it('overrides config with current state for metadata, user and context', () => {
    expect(JSON.parse(serializeConfigForRenderer({
      apiKey: '123',
      metadata: { foo: { bar: 'baz' } },
      user: { id: '123' },
      context: 'initial'
    }, { foo: { bar: 'biz' } }, { flag: '123' }, { id: '456' }, 'secondary'))).toEqual({
      apiKey: '123',
      metadata: { foo: { bar: 'biz' } },
      features: { flag: '123' },
      user: { id: '456' },
      context: 'secondary'
    })
  })
})
