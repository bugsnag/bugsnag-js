import { add, clear } from '../lib/metadata-delegate'

// it doesn't seem easy or even impossible to check whether __proto__ keys can be overwritten
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/proto
// so tests are only for prototype and constructor

describe('metadata delegate', () => {
  describe('clear', () => {
    it.each([
      {
        key: 'constructor',
        expected: {
          constructor: {
            foo: 'bar'
          }
        }
      },
      {
        key: 'prototype',
        expected: {
          prototype: {
            foo: 'bar'
          }
        }
      }
    ])('should not overwrite constructor keys', ({ key, expected }) => {
      const state = {}

      add(state, key, 'foo', 'bar')

      clear(state, key, 'foo')

      expect(state).toEqual(expected)
    })
  })
})
