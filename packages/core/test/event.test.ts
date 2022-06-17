import ErrorStackParser from 'error-stack-parser'
import Event from '../event'

jest.mock('stack-generator', () => ({
  backtrace: () => [{}, {}]
}))

describe('@bugsnag/core/event', () => {
  describe('constructor', () => {
    it('sets default handledState', () => {
      const err = new Error('noooooo')
      const r = new Event(err.name, err.message, ErrorStackParser.parse(err))
      expect(r._handledState.severity).toBe('warning')
      expect(r._handledState.unhandled).toBe(false)
      expect(r._handledState.severityReason).toEqual({ type: 'handledException' })
    })

    it('doesn’t create empty stackframes', () => {
      const err = new Error('noooooo')
      const r = new Event(err.name, err.message, [
        { foo: 10 },
        { toJSON: () => { throw new Error('do not serialise me, srsly') } }
      ])
      expect(r.errors[0].stacktrace.length).toBe(0)
    })
  })

  describe('addMetadata()', () => {
    it('updates a whole new section', () => {
      const r = new Event('Err', 'bad', [])
      r.addMetadata('specific detail', { extra: 'stuff' })
      expect((r._metadata)['specific detail']).toEqual({ extra: 'stuff' })
    })

    it('merges an object with an existing section', () => {
      const r = new Event('Err', 'bad', [])
      r.addMetadata('specific detail', { extra: 'stuff' })
      expect((r._metadata)['specific detail']).toEqual({ extra: 'stuff' })
      r.addMetadata('specific detail', { detail: 500 })
      expect((r._metadata)['specific detail']).toEqual({ extra: 'stuff', detail: 500 })
    })

    it('adds a single property to an existing section', () => {
      const r = new Event('Err', 'bad', [])
      r.addMetadata('specific detail', { extra: 'stuff' })
      expect((r._metadata)['specific detail']).toEqual({ extra: 'stuff' })
      r.addMetadata('specific detail', 'more', 'things')
      expect((r._metadata)['specific detail']).toEqual({ extra: 'stuff', more: 'things' })
    })

    it('creates a new section when updating a single property that doesn’t exist yet', () => {
      const r = new Event('Err', 'bad', [])
      r.addMetadata('metaaaaa', 'flip', 'flop')
      expect((r._metadata).metaaaaa).toEqual({ flip: 'flop' })
    })

    it('handles bad input', () => {
      const r = new Event('Err', 'bad', [])
      const before = Object.assign({}, r._metadata)
      // @ts-ignore
      r.addMetadata()
      expect(r._metadata).toEqual(before)
      // @ts-ignore
      r.addMetadata(123)
      expect(r._metadata).toEqual(before)
      // @ts-ignore
      r.addMetadata(new Date())
      expect(r._metadata).toEqual(before)
      // @ts-ignore
      r.addMetadata('strrrr')
      expect(r._metadata).toEqual(before)
    })

    it('removes sections and properties', () => {
      const r = new Event('Err', 'bad', [])
      r.addMetadata('metaaaaa', 'flip', 'flop')
      r.addMetadata('specific detail', { extra: 'stuff', more: 'things' })

      // @ts-ignore
      r.addMetadata('metaaaaa', null)
      expect((r._metadata).metaaaaa).toBe(undefined)

      r.addMetadata('specific detail', 'more', null)
      expect((r._metadata)['specific detail']).toEqual({ extra: 'stuff', more: null })
    })
  })

  describe('event.clearMetadata()', () => {
    it('removes things', () => {
      const r = new Event('Err', 'bad', [])

      // create some things to be removed
      r.addMetadata('specific detail', { extra: 'stuff' })
      r.addMetadata('another thing', { check: 12, t: 0 })
      expect(r._metadata).toEqual({
        'another thing': { check: 12, t: 0 },
        'specific detail': { extra: 'stuff' }
      })

      r.clearMetadata('specific detail')
      expect((r._metadata)['specific detail']).toBe(undefined)

      r.clearMetadata('another thing', 't')
      expect((r._metadata)['another thing']).toEqual({ check: 12 })
    })

    it('handles bad input', () => {
      const r = new Event('Err', 'bad', [])

      // create some things to be removed
      r.addMetadata('specific detail', { extra: 'stuff' })
      r.addMetadata('another thing', { check: 12, t: 0 })
      expect(r._metadata).toEqual({
        'another thing': { check: 12, t: 0 },
        'specific detail': { extra: 'stuff' }
      })

      // calling with bad input
      const before = Object.assign({}, r._metadata)
      // @ts-ignore
      r.clearMetadata()
      expect(r._metadata).toEqual(before)
      // @ts-ignore
      r.clearMetadata(123)
      expect(r._metadata).toEqual(before)
      // @ts-ignore
      r.clearMetadata(new Date())
      expect(r._metadata).toEqual(before)

      // removing a property of a section that doesn't exist
      r.clearMetadata('foo', 'bar')
      expect(r._metadata).toEqual(before)
    })
  })

  describe('event.getMetadata()', () => {
    it('retrieves things', () => {
      const r = new Event('Err', 'bad', [])

      // create some things to be get
      r.addMetadata('specific detail', { extra: 'stuff' })
      r.addMetadata('another thing', { check: 12, t: 0 })
      expect(r.getMetadata('another thing')).toEqual({ check: 12, t: 0 })
      expect(r.getMetadata('specific detail')).toEqual({ extra: 'stuff' })
      expect(r.getMetadata('specific detail', 'extra')).toEqual('stuff')
    })

    it('handles bad input', () => {
      const r = new Event('Err', 'bad', [])
      expect(r.getMetadata('nothing here')).toBe(undefined)
      // @ts-ignore
      expect(r.getMetadata(undefined)).toBe(undefined)
      expect(r.getMetadata('nothing here', 'or here')).toBe(undefined)
      r.addMetadata('specific detail', { extra: 'stuff' })
      expect(r.getMetadata('specific detail', 'jim')).toBe(undefined)
    })
  })

  describe('event.setUser() / event.getUser()', () => {
    it('sets and retrieves user properties', () => {
      const r = new Event('Err', 'bad', [])
      r.setUser('123')
      expect(r.getUser()).toEqual({ id: '123', email: undefined, name: undefined })
      r.setUser('123', 'bug@sn.ag')
      expect(r.getUser()).toEqual({ id: '123', email: 'bug@sn.ag', name: undefined })
      r.setUser('123', 'bug@sn.ag', 'Bug S. Nag')
      expect(r.getUser()).toEqual({ id: '123', email: 'bug@sn.ag', name: 'Bug S. Nag' })
      r.setUser()
      expect(r.getUser()).toEqual({ id: undefined, email: undefined, name: undefined })
    })
  })

  describe('event.toJSON()', () => {
    it('serializes correctly', () => {
      const r = new Event('Err', 'bad', [])
      const reserialized = JSON.parse(JSON.stringify(r))
      expect(reserialized.payloadVersion).toBe('4')
      expect(reserialized.exceptions.length).toBe(1)
    })
  })

  describe('feature flags', () => {
    describe('#addFeatureFlag', () => {
      it('adds the given flag/variant combination', () => {
        const event = new Event('Err', 'bad', [])

        event.addFeatureFlag('a name', 'variant number 1234')

        expect(event._features).toStrictEqual({ 'a name': 'variant number 1234' })
      })

      it('overwrites an existing flag by name', () => {
        const event = new Event('Err', 'bad', [])

        event.addFeatureFlag('a name', 'variant number 1234')
        event.addFeatureFlag('a name', 'variant number 5678')

        expect(event._features).toStrictEqual({ 'a name': 'variant number 5678' })
      })

      it('adds the given flag when no variant is passed', () => {
        const event = new Event('Err', 'bad', [])

        event.addFeatureFlag('a name')

        expect(event._features).toStrictEqual({ 'a name': null })
      })

      it('adds the given flag when the variant is null', () => {
        const event = new Event('Err', 'bad', [])

        event.addFeatureFlag('a name', null)

        expect(event._features).toStrictEqual({ 'a name': null })
      })

      it('does not add the flag if no name is passed', () => {
        const event = new Event('Err', 'bad', [])

        // @ts-expect-error
        event.addFeatureFlag()

        expect(event._features).toStrictEqual({})
      })
    })

    describe('#addFeatureFlags', () => {
      it('adds the given feature flags', () => {
        const event = new Event('Err', 'bad', [])

        event.addFeatureFlags([
          { name: 'abc' },
          { name: 'xyz', variant: 'yes' },
          { name: 'aaa', variant: 'no' },
          { name: 'zzz', variant: 'maybe' },
          { name: 'idk' }
        ])

        expect(event._features).toStrictEqual({
          abc: null,
          xyz: 'yes',
          aaa: 'no',
          zzz: 'maybe',
          idk: null
        })
      })

      it('does not add the flags if none are passed', () => {
        const event = new Event('Err', 'bad', [])

        event.addFeatureFlags([])

        expect(event._features).toStrictEqual({})
      })

      it('does not add flags if nothing is passed', () => {
        const event = new Event('Err', 'bad', [])

        // @ts-expect-error
        event.addFeatureFlags()

        expect(event._features).toStrictEqual({})
      })
    })

    describe('#clearFeatureFlag', () => {
      it('removes the given flag', () => {
        const event = new Event('Err', 'bad', [])

        event.clearFeatureFlag('a')

        expect(event._features).toStrictEqual({})
      })

      it('does nothing if there are no flags', () => {
        const event = new Event('Err', 'bad', [])

        event.clearFeatureFlag('a')

        expect(event._features).toStrictEqual({})
      })

      it('does nothing if the given flag does not exist', () => {
        const event = new Event('Err', 'bad', [])

        event.clearFeatureFlag('b')

        expect(event._features).toStrictEqual({})
      })

      it('does nothing if not given a flag', () => {
        const event = new Event('Err', 'bad', [])

        // @ts-expect-error
        event.clearFeatureFlag()

        expect(event._features).toStrictEqual({})
      })
    })

    describe('#clearFeatureFlags', () => {
      it('removes all flags', () => {
        const event = new Event('Err', 'bad', [])

        event.clearFeatureFlags()

        expect(event._features).toStrictEqual({})
      })

      it('does nothing if there are no flags', () => {
        const event = new Event('Err', 'bad', [])

        event.clearFeatureFlags()

        expect(event._features).toStrictEqual({})
      })
    })

    it('includes feature flags in JSON payload', () => {
      const event = new Event('Err', 'bad', [])
      event.addFeatureFlag('abc', '123')
      event.addFeatureFlags([
        { name: 'x', variant: '9' },
        { name: 'y' },
        { name: 'z', variant: '8' }
      ])

      const payload = event.toJSON()

      expect(payload.featureFlags).toStrictEqual([
        { featureFlag: 'abc', variant: '123' },
        { featureFlag: 'x', variant: '9' },
        { featureFlag: 'y' },
        { featureFlag: 'z', variant: '8' }
      ])
    })
  })

  describe('Event.create()', () => {
    it('includes causes in the exceptions array', () => {
      const err = new Error('I am the error')
      // @ts-ignore
      err.cause = new Error('I am the cause')
      // @ts-ignore
      const event = Event.create(err, true, undefined, 'notify()', 0)
      expect(event.errors.length).toBe(2)
      expect(event.errors).toContainEqual(
        expect.objectContaining({
          errorClass: 'Error',
          errorMessage: 'I am the cause',
          stacktrace: expect.arrayContaining([
            expect.objectContaining({
              file: expect.any(String),
              method: expect.any(String),
              lineNumber: expect.any(Number),
              columnNumber: expect.any(Number)
            })
          ]),
          type: 'browserjs'
        }))
    })

    it('converts a string cause into an exception', () => {
      const err = new Error('I am the error')
      // @ts-ignore
      err.cause = 'I am the cause'
      // @ts-ignore
      const event = Event.create(err, true, undefined, 'notify()', 0)
      expect(event.errors.length).toBe(2)
      expect(event.errors).toContainEqual({
        errorClass: 'Error',
        errorMessage: 'I am the cause',
        stacktrace: [],
        type: 'browserjs'
      })
    })

    it('handles invalid cause errors', () => {
      const err = new Error('I am an error')
      // @ts-ignore
      err.cause = { error: 'I am not an Error' }
      // @ts-ignore
      const event = Event.create(err, true, undefined, '', 0)
      expect(event.errors.length).toBe(2)
      expect(event.errors).toContainEqual({
        errorClass: 'InvalidError',
        errorMessage: 'error cause was a non-error. See "error cause" tab for more detail.',
        stacktrace: [],
        type: 'browserjs'
      })
      expect(event.getMetadata('error cause')).toEqual({ error: 'I am not an Error' })
    })

    it('tolerates non-error causes regardless of tolerateNonErrors being true/false', () => {
      const err = new Error('I am an error')
      // @ts-ignore
      err.cause = 'I am not an Error'

      // @ts-ignore
      const event = Event.create(err, false, undefined, '', 0)
      expect(event.getMetadata('error cause')).toBeUndefined()
      expect(event.errors.length).toBe(2)
      expect(event.errors).not.toContainEqual(
        expect.objectContaining({
          errorClass: 'InvalidError',
          errorMessage: expect.any(String),
          stacktrace: expect.any(Array),
          type: expect.any(String)
        }))
    })
  })
})
