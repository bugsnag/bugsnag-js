import { promises } from 'fs'
import diff from 'jest-diff'

const { access } = promises

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAFile: () => CustomMatcherResult
      toMatchBreadcrumb: (expected: any) => CustomMatcherResult
    }
  }
}

expect.extend({
  async toBeAFile (received: string) {
    try {
      await access(received)
      return {
        message: () => `expected ${received} not to exist in the file system`,
        pass: true
      }
    } catch (e) {
      return {
        message: () => `expected ${received} to exist in the file system`,
        pass: false
      }
    }
  },

  toMatchBreadcrumb (received: any, expected: any) {
    const options = { isNot: this.isNot, promise: this.promise }

    const pass = (
      typeof received === 'object' &&
      received !== null &&
      received.message === expected.message &&
      received.type === expected.type &&
      this.equals(received.metadata, expected.metadata)
    )

    if (pass) {
      return {
        message: () =>
          this.utils.matcherHint('toMatchBreadcrumb', undefined, undefined, options) +
          '\n\n' +
          `Expected: ${this.utils.printExpected(expected)}\n` +
          `Received: ${this.utils.printReceived(received)}`,
        received,
        pass
      }
    }

    const diffString = diff(expected, received, { expand: this.expand })

    return {
      message: () =>
        this.utils.matcherHint('toMatchBreadcrumb', undefined, undefined, options) +
        '\n\n' +
        (diffString?.includes('- Expect') === true
          ? `Difference:\n\n${diffString}`
          : `Expected: ${this.utils.printExpected(expected)}\n` +
            `Received: ${this.utils.printReceived(received)}`),
      received,
      pass
    }
  }
})
