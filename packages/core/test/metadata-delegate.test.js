import { add, clear } from '../lib/metadata-delegate'

// it doesn't seem easy or even impossible to check whether __proto__ keys can be overwritten
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/proto
// so tests are only for prototype and constructor

describe('metadata delegate', () => {
  describe('add', () => {
    it.each([
      {
        key: 'constructor',
        expected: {}
      },
      {
        key: 'prototype',
        expected: {}
      }
    ])('should not add $key keys', ({ key, expected }) => {
      const state = {}
      add(state, key, 'foo', 'bar')
      expect(state).toEqual(expected)
    })
  })

  describe('clear', () => {
    it.each([
      {
        key: 'constructor',
        state: {
          constructor: {
            foo: 'bar'
          }
        },
        expected: {
          constructor: {
            foo: 'bar'
          }
        }
      },
      {
        key: 'prototype',
        state: {
          prototype: {
            foo: 'bar'
          }
        },
        expected: {
          prototype: {
            foo: 'bar'
          }
        }
      }
    ])('should not overwrite $key keys', ({ key, state, expected }) => {
      clear(state, key, 'foo')
      expect(state).toEqual(expected)
    })
  })
})
