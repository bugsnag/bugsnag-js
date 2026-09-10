// these paths must be specified because otherwise typescript relies on the
// "main" field in each package.json file, which points to the compiled JS and
// we want to run Jest against the TS source
const paths = {
  // @bugsnag/core must resolve to source so that module-level singleton state
  // (e.g. clone-client's onCloneCallbacks) is shared across jest.isolateModules
  // boundaries. Without this, bundled dist creates duplicate state.
  '@bugsnag/core': ['./packages/core/src/index.ts']
}

const moduleNameMapper = Object.fromEntries(
  Object.entries(paths)
    .map(([name, directories]) => [
      `^${name}$`,
      directories.map(directory => directory.replace('./', '<rootDir>/'))
    ])
)

const defaultModuleConfig = {
  preset: 'ts-jest/presets/js-with-ts',
  moduleNameMapper,
  transform: {
    '^.+\\.m?[tj]sx?$': [
      'ts-jest',
      {
        isolatedModules: true,
        tsconfig: {
          module: 'commonjs',
          target: 'ES2019',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          allowJs: true,
          skipLibCheck: true,
          jsx: 'react',
          paths
        }
      }
    ]
  }
}

module.exports = {
  projects: [
    {
      ...defaultModuleConfig,
      setupFilesAfterEnv: ['<rootDir>/test/electron/setup.ts'],
      clearMocks: true,
      modulePathIgnorePatterns: ['.verdaccio', 'fixtures', 'examples'],
      displayName: 'electron main',
      runner: '@kayahr/jest-electron-runner/main',
      testEnvironment: 'node',
      testMatch: ['**/test/**/*.test-main.ts']
    },
    {
      ...defaultModuleConfig,
      setupFilesAfterEnv: ['<rootDir>/test/electron/setup.ts'],
      clearMocks: true,
      modulePathIgnorePatterns: ['.verdaccio', 'fixtures', 'examples'],
      displayName: 'electron renderer',
      runner: '@kayahr/jest-electron-runner',
      testEnvironment: '@kayahr/jest-electron-runner/environment',
      testMatch: ['**/test/**/*.test-renderer.ts']
    }
  ]
}
