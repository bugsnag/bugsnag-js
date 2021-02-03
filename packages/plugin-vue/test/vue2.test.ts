import { classify } from '../src/vue2'

it('bugsnag vue: classify(str)', () => {
  expect(classify('foo_bar')).toBe('FooBar')
  expect(classify('foo-bar')).toBe('FooBar')
})
