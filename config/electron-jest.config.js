module.exports = {
  projects: [
    {
      resolver: '<rootDir>/jest/node-exports-resolver',
      setupFilesAfterEnv: ['<rootDir>/test/electron/setup.ts'],
      clearMocks: true,
      modulePathIgnorePatterns: ['.verdaccio', 'fixtures', 'examples'],
      displayName: 'electron main',
      runner: '@jest-runner/electron/main',
      testMatch: ['**/test/**/*.test-main.ts']
    },
    {
      resolver: '<rootDir>/jest/node-exports-resolver',
      setupFilesAfterEnv: ['<rootDir>/test/electron/setup.ts'],
      clearMocks: true,
      modulePathIgnorePatterns: ['.verdaccio', 'fixtures', 'examples'],
      displayName: 'electron renderer',
      runner: '@jest-runner/electron',
      testMatch: ['**/test/**/*.test-renderer.ts']
    }
  ]
}
