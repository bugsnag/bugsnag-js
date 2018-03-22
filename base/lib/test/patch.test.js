const { describe, it, expect, jasmine } = global
const patch = require('../patch')

describe('patch()', () => {
  it('replaces the patched method on the object', () => {
    let spy = new jasmine.Spy()
    let object = { doSomething () {} }
    patch(object, 'doSomething', spy)
    object.doSomething('foo')
    expect(spy).toHaveBeenCalledWith('foo')
  })

  it('calls the original method on the object', () => {
    let spy = new jasmine.Spy()
    let object = { doSomething: spy }
    patch(object, 'doSomething', () => {})
    object.doSomething('foo')
    expect(spy).toHaveBeenCalledWith('foo')
  })

  describe('original method does not exist', () => {
    it('does not crash', () => {
      expect(() => {
        patch({}, 'doSomething', () => {})
      }).not.toThrowError(TypeError)
    })
  })

  describe('.restore()', () => {
    it('restores the original function', () => {
      let method = () => {}
      let object = { method }
      let restore = patch(object, 'method', () => {})
      restore()
      expect(object.method).toEqual(method)
    })
  })
})
