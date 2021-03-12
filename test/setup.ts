import { promises } from 'fs'

const { access } = promises

/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unused-vars */
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAFile: () => CustomMatcherResult
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
  }
})
