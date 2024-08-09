module.exports = {
  projects: [
    {
      setupFilesAfterEnv: ['<rootDir>/test/electron/setup.ts'],
      clearMocks: true,
      modulePathIgnorePatterns: ['.verdaccio', 'fixtures', 'examples'],
      displayName: 'electron main',
      runner: '@kayahr/jest-electron-runner/main',
      testMatch: ['**/test/**/*.test-main.ts']
    },
    {
      setupFilesAfterEnv: ['<rootDir>/test/electron/setup.ts'],
      clearMocks: true,
      modulePathIgnorePatterns: ['.verdaccio', 'fixtures', 'examples'],
      displayName: 'electron renderer',
      "runner": "@kayahr/jest-electron-runner",
    "testEnvironment": "@kayahr/jest-electron-runner/environment",
      testMatch: ['**/test/**/*.test-renderer.ts']
    }
  ]
}
