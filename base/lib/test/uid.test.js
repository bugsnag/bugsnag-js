const { describe, it, expect } = global

const uid = require('../uid')

describe('uid()', () => {
  it('should not collide', () => {
    const seen = new Set()
    while (seen.size < 10e4) {
      const id = uid()
      expect(seen.has(id)).toBe(false)
      seen.add(id)
    }
  })

  it('should look like a UUIDv4', () => {
    Array(10e3).fill(true).forEach(() =>
      expect(uid()).toMatch(
        /[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}/
      )
    )
  })
})
