import type { Config } from '@jest/types'

const common: Config.InitialOptions = {
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  clearMocks: true,
  modulePathIgnorePatterns: ['.verdaccio', 'test/fixtures', 'test\\fixtures']
}

export default {
  projects: [
    {
      ...common,
      testMatch: ['**/test/**/*.test.ts']
    },
    {
      ...common,
      displayName: 'main',
      runner: '@jest-runner/electron/main',
      testMatch: ['**/test/**/*.test-main.ts']
    },
    {
      ...common,
      displayName: 'renderer',
      runner: '@jest-runner/electron',
      testMatch: ['**/test/**/*.test-renderer.ts']
    }
  ]
}
