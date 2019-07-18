const { describe, it, expect } = global

const State = require('../state')

describe('@bugsnag/core/lib/state', () => {
  describe('constructor()', () => {
    it('should construct an object and set the default initial values', () => {
      const m = new State()
      expect(m).toBeTruthy()
      expect(Object.keys(m.state)).toContain('$__context')
      expect(Object.keys(m.state)).toContain('$__app')
      expect(Object.keys(m.state)).toContain('$__device')
      expect(Object.keys(m.state)).toContain('$__threads')
      expect(Object.keys(m.state)).toContain('$__user')
      expect(Object.keys(m.state)).toContain('$__request')
    })

    it('should merge extra properties with the default set', () => {
      const m = new State({ 'something': { initialValue: () => 'jim' } })
      expect(m).toBeTruthy()
      expect(m.state.$__something).toBe('jim')
    })
  })

  describe('get()', () => {
    it('should work with various examples', () => {
      const m = new State()
      m.set('cat', { attributes: [ 'whiskers', 'teeth' ], meow: true })
      expect(m.get('cat')).toEqual({ attributes: [ 'whiskers', 'teeth' ], meow: true })
      expect(m.get('cat', 'attributes')).toEqual([ 'whiskers', 'teeth' ])
      expect(m.get('cat', 'attributes_')).toEqual(undefined)
      expect(m.get('cat', 123, new Date())).toEqual(undefined)
      expect(m.get('dog')).toEqual(undefined)
    })
  })

  describe('set()', () => {
    it('should work with various examples', () => {
      const m = new State()
      m.set('cat', { attributes: [ 'whiskers', 'teeth' ], meow: true })
      expect(m.get('cat')).toEqual({ attributes: [ 'whiskers', 'teeth' ], meow: true })
      m.set('cat', 'meow', false)
      expect(m.get('cat')).toEqual({ attributes: [ 'whiskers', 'teeth' ], meow: false })
      m.set('dog', 'obedience', 'sit', true)
      expect(m.get('dog')).toEqual({ obedience: { sit: true } })
      m.set('house', { bedrooms: false, doors: 4, bathrooms: true, receptionrooms: {} })
      m.set('house', 'bedrooms', 'upstairs', [ 'master', 'second' ])
      m.set('house', 'bathrooms', 'downstairs', [ 'toilet' ])
      m.set('house', 'receptionrooms', 'downstairs', [ 'living room', 'dining room' ])
      expect(m.get('house')).toEqual({
        bedrooms: { upstairs: [ 'master', 'second' ] },
        bathrooms: { downstairs: [ 'toilet' ] },
        receptionrooms: { downstairs: [ 'living room', 'dining room' ] },
        doors: 4
      })
    })

    it('should work with with an object of combined updates', () => {
      const m = new State()
      m.set({
        'cat': { attributes: [ 'whiskers', 'teeth' ], meow: true }
      })
      expect(m.get('cat')).toEqual({ attributes: [ 'whiskers', 'teeth' ], meow: true })
    })

    it('should work with bad input', () => {
      const m = new State()
      const entriesBefore = Object.keys(m.state)
      m.set('cat')
      const entriesAfter = Object.keys(m.state)
      expect(entriesAfter).toEqual(entriesBefore)
    })

    it('should merge top level objects', () => {
      const m = new State()
      m.set('cat', { attributes: [ 'whiskers', 'teeth' ], meow: true })
      expect(m.get('cat')).toEqual({ attributes: [ 'whiskers', 'teeth' ], meow: true })
      m.set('cat', { legs: [ 'front right', 'back right', 'front left', 'back left' ] })
      expect(m.get('cat')).toEqual({
        attributes: [ 'whiskers', 'teeth' ],
        meow: true,
        legs: [ 'front right', 'back right', 'front left', 'back left' ]
      })
    })

    it('should merge lower-level objects', () => {
      const m = new State()
      m.set('foo', 'bar', { baz: 'barry' })
      expect(m.get('foo')).toEqual({ bar: { baz: 'barry' } })
      m.set('foo', 'bar', { boz: 'borry' })
      expect(m.get('foo')).toEqual({ bar: { baz: 'barry', boz: 'borry' } })
    })

    it('should not work on immutable properties', (done) => {
      const m = new State({}, (msg) => {
        expect(msg).toMatch(/"app\.releaseStage" cannot be changed/)
        done()
      })
      m.lock()
      m.set('app', 'releaseStage', 'staging')
    })

    it('should not work on required sections', (done) => {
      const m = new State({}, (msg) => {
        expect(msg).toMatch(/"app" must be an object/)
        done()
      })
      m.lock()
      m.set('app', 1)
    })
  })

  describe('clear()', () => {
    it('should work with various examples', () => {
      const m = new State()
      m.set('cat', { attributes: [ 'whiskers', 'teeth' ], meow: true })
      expect(m.get('cat')).toEqual({ attributes: [ 'whiskers', 'teeth' ], meow: true })
      m.clear('cat', 'meow')
      expect(m.get('cat')).toEqual({ attributes: [ 'whiskers', 'teeth' ] })
      m.clear('dog', 'teeth', 'canine', 'sharp')
      expect(m.get('dog')).toEqual(undefined)
    })

    it('should not work on immutable properties', (done) => {
      const m = new State({}, (msg) => {
        expect(msg).toMatch(/"app\.releaseStage" cannot be changed/)
        done()
      })
      m.set('app', 'releaseStage', 'staging')
      m.lock()
      m.clear('app', 'releaseStage')
    })

    it('should not work on required sections', (done) => {
      const m = new State({}, (msg) => {
        expect(msg).toMatch(/"app" is required and can’t be cleared/)
        done()
      })
      m.clear('app')
    })
  })

  describe('toPayload()', () => {
    it('should work with various examples', () => {
      const m = new State()
      m.set('cat', { attributes: [ 'whiskers', 'teeth' ], meow: true })
      m.set('device', { id: '123', pixelRatio: 100 })
      expect(m.toPayload()).toEqual({
        metaData: {
          app: {},
          device: { pixelRatio: 100 },
          request: {},
          user: {},
          cat: { attributes: [ 'whiskers', 'teeth' ], meow: true }
        },
        app: {},
        device: { id: '123' },
        request: {},
        threads: {},
        user: {},
        context: undefined
      })
    })
  })

  describe('extend()', () => {
    it('should work with primitive types', () => {
      const m = new State()
      m.set('context', '123')
      const n = new State()
      n.extend(m)
      expect(n.get('context')).toBe('123')
    })

    it('should work with objects', () => {
      const m = new State()
      m.set('app', { name: 'my app', entrypoint: 'experminents/b/index.js' })
      const n = new State()
      n.extend(m)
      expect(n.get('app', 'name')).toBe('my app')
    })

    it('should work with arrays', () => {
      const m = new State()
      m.set('items', [ 1, 2, 3 ])
      const n = new State()
      n.extend(m)
      expect(Array.isArray(n.get('items'))).toBe(true)
    })
  })

  describe('_setWithObject()', () => {
    it('honours the rules', () => {
      const m = new State()
      m.set({ app: { version: '1.2.3' } })
      m.lock()
      m.set({ app: { version: '1.2.4' } })
      expect(m.get('app', 'version')).toBe('1.2.3')
    })
  })
})
