const testsForPackage = (packageName) => `<rootDir>/packages/${packageName}/**/*.test.[jt]s?(x)`

const defaultModuleConfig = {
  preset: 'ts-jest/presets/js-with-ts',

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
          jsx: 'react'
        }
      }
    ]
  }
}

const project = (displayName, packageNames, customConfig = {}) => ({
  ...defaultModuleConfig,
  roots: ['<rootDir>/packages'],
  displayName,
  testMatch: packageNames.map(testsForPackage),
  ...customConfig
})

const extensions = 'js,jsx,ts,tsx'

module.exports = {
  modulePathIgnorePatterns: [
    '<rootDir>/packages/[^/]+/dist/'
  ],

  testTimeout: 10000,

  workerIdleMemoryLimit: '1GB',

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
    'json-summary',
    'json',
    'lcov',
    'text',
    'clover'
  ],

  projects: [
    project('core', ['core'], {
      testEnvironment: 'node'
    }),

    project('utilities', ['derecursify', 'json-payload'], {
      testEnvironment: 'node'
    }),

    project('web workers', ['web-worker'], {
      testEnvironment: '<rootDir>/jest/FixJSDOMEnvironment.js'
    }),

    project('shared plugins', [
      'plugin-app-duration',
      'plugin-stackframe-path-normaliser'
    ]),

    project('browser', [
      'browser',
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
      'plugin-network-instrumentation',
      'request-tracker'
    ], {
      testEnvironment: 'jsdom'
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

      testEnvironment: 'node',

      setupFiles: [
        '<rootDir>/packages/react-native/src/test/setup.js'
      ],

      /*
       * React Native packages contain Flow syntax and must be processed
       * with Babel. Do not use ts-jest for this project.
       */
      transform: {
        '^.+\\.[jt]sx?$': 'babel-jest'
      },

      /*
       * Jest normally ignores node_modules. These React Native packages
       * must be transformed because they contain Flow/React Native syntax.
       */
      transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|@react-navigation|jest-react-native|@react-native-community)/)'
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

    project('node integration tests', [], {
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
      setupFilesAfterEnv: [
        '<rootDir>/test/electron/setup.ts'
      ],

      testEnvironment: 'node',
      clearMocks: true
    }),

    project('react native cli', ['react-native-cli'], {
      testEnvironment: 'node'
    }),

    project('cloudflare-workers', ['plugin-cloudflare-workers'], {
      testEnvironment: 'node',

      setupFilesAfterEnv: [
        '<rootDir>/packages/plugin-cloudflare-workers/test/setup.ts'
      ]
    })
  ]
}