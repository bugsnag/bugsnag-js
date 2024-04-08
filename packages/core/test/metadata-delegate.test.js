import { add, clear } from '../lib/metadata-delegate'

// it doesn't seem easy or even impossible to check whether __proto__ keys can be overwritten
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/proto
// so tests are only for prototype and constructor

describe('metadata delegate', () => {
  describe('clear', () => {
    it('should not overwrite prototype keys', () => {
      const state = {}

      add(state, 'prototype', 'foo', 'bar')

      clear(state, 'prototype', 'foo')

      expect(state).toStrictEqual({
        prototype: {
          foo: 'bar'
        }
      })
    })

    it('should not overwrite constructor keys', () => {
      const state = {}

      add(state, 'constructor', 'foo', 'bar')

      clear(state, 'constructor', 'foo')

      expect(state).toEqual({
        constructor: {
          foo: 'bar'
        }
      })
    })
  })
})
