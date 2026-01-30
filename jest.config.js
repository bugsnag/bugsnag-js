const testsForPackage = (packageName) => `<rootDir>/packages/${packageName}/**/*.test.[jt]s?(x)`

// Base configuration shared across all projects
const baseConfig = {
  preset: 'ts-jest/presets/js-with-ts',
  transform: {
    '^.+\\.[jt]sx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        allowJs: true
      },
      diagnostics: {
        ignoreCodes: [7016]
      }
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@bugsnag)/)'
  ],
  roots: ['<rootDir>/packages']
}

const project = (displayName, packageNames, customConfig = {}) => {
  return {
    ...baseConfig,
    displayName,
    testMatch: packageNames.map(testsForPackage),
    ...customConfig
  }
}

const extensions = 'js,jsx,ts,tsx'

module.exports = {
  testTimeout: 10000,
  collectCoverageFrom: [
    `**/packages/*/src/**/*.{${extensions}}`,
    `!**/*.test.{${extensions}}`,
    `!**/*.test-*.{${extensions}}`,
    '!**/*.d.ts',
    '!**/dist/**',
    '!**/node_modules/**',
    '!**/packages/js/**',
    '!<rootDir>/packages/plugin-angular/**/*',
    '!<rootDir>/packages/react-native/src/test/setup.js',
    '!<rootDir>/packages/plugin-node-surrounding-code/test/fixtures/**/*'
  ],
  coverageReporters: [
    'json-summary', 'json', 'lcov', 'text', 'clover'
  ],
  projects: [
    project('core', ['core'], {
      testEnvironment: 'node'
    }),
    project('utilities', ['derecursify', 'json-payload'], {
      testEnvironment: 'node'
    }),
    project('web workers', ['web-worker'], {
      testEnvironment: 'jsdom'
    }),
    project('shared plugins', ['plugin-app-duration', 'plugin-stackframe-path-normaliser', 'request-tracker'], {
      testEnvironment: 'node'
    }),
    project('browser', [
      'browser',
      'delivery-x-domain-request',
      'delivery-xml-http-request',
      'delivery-fetch',
      'plugin-react',
      'plugin-vue',
      'plugin-browser-context',
      'plugin-browser-device',
      'plugin-browser-request',
      'plugin-client-ip',
      'plugin-navigation-breadcrumbs',
      'plugin-network-breadcrumbs',
      'plugin-window-unhandled-rejection',
      'plugin-window-onerror',
      'plugin-strip-query-string',
      'plugin-interaction-breadcrumbs',
      'plugin-inline-script-content',
      'plugin-simple-throttle',
      'plugin-console-breadcrumbs',
      'plugin-browser-session',
      'plugin-network-instrumentation'
    ], {
      testEnvironment: 'jsdom'
      modulePathIgnorePatterns: ['.verdaccio', 'dist', 'examples', 'fixtures']
    }),
    project('react native', [
      'react-native',
      'delivery-react-native',
      'plugin-react-native-app-state-breadcrumbs',
      'plugin-react-native-connectivity-breadcrumbs',
      'plugin-react-native-orientation-breadcrumbs',
      'plugin-react-native-unhandled-rejection',
      'plugin-react-native-hermes',
      'plugin-react-native-client-sync',
      'plugin-react-native-event-sync',
      'plugin-react-native-global-error-handler',
      'plugin-react-native-session',
      'plugin-react-navigation',
      'plugin-react-native-navigation'
    ], {
      preset: 'react-native',
      setupFiles: [
        '<rootDir>/packages/react-native/src/test/setup.js'
      ],
      transform: {
        // Override preset's babel-jest with ts-jest
        '^.+\\.(js|ts|tsx)$': ['ts-jest', {
          tsconfig: {
            module: 'commonjs',
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            allowJs: true
          }
        }],
        // Keep asset transformer from preset
        '^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$': require.resolve('react-native/jest/assetFileTransformer.js')
      },
      transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|@bugsnag)/)'
      ]
    }),
    project('node plugins', [
      'delivery-node',
      'in-flight',
      'plugin-aws-lambda',
      'plugin-express',
      'plugin-koa',
      'plugin-hono',
      'plugin-restify',
      'plugin-contextualize',
      'plugin-server-*',
      'plugin-strip-project-root',
      'plugin-intercept',
      'plugin-node-unhandled-rejection',
      'plugin-node-in-project',
      'plugin-node-device',
      'plugin-node-surrounding-code',
      'plugin-node-uncaught-exception'
    ], {
      testEnvironment: 'node'
    }),
    project('node integration tests', [
    ], {
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/packages/node/test/**/*.test.[jt]s',
        '<rootDir>/packages/node/test/integration/**/*.test.[jt]s'
      ]
    }),
    project('electron', [
      'delivery-electron',
      'electron',
      'electron-filestore',
      'electron-test-helpers',
      'electron-network-status',
      'plugin-electron-app',
      'plugin-electron-app-breadcrumbs',
      'plugin-electron-client-state-manager',
      'plugin-electron-client-state-persistence',
      'plugin-electron-deliver-minidumps',
      'plugin-electron-device',
      'plugin-electron-ipc',
      'plugin-electron-net-breadcrumbs',
      'plugin-electron-network-status',
      'plugin-electron-power-monitor-breadcrumbs',
      'plugin-electron-preload-error',
      'plugin-electron-process-info',
      'plugin-electron-renderer-client-state-updates',
      'plugin-electron-renderer-event-data',
      'plugin-electron-renderer-strip-project-root',
      'plugin-electron-screen-breadcrumbs',
      'plugin-electron-session',
      'plugin-internal-callback-marker'
    ], {
      setupFilesAfterEnv: ['<rootDir>/test/electron/setup.ts'],
      testEnvironment: 'node',
      clearMocks: true,
      modulePathIgnorePatterns: ['.verdaccio', 'fixtures']
    }),
    project('react native cli', ['react-native-cli'], { 
      testEnvironment: 'node' 
    }),
    project('cloudflare-workers', ['plugin-cloudflare-workers'], {
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/packages/plugin-cloudflare-workers/test/setup.ts']
    })
  ]
}
