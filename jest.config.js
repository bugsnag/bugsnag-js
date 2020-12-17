const testsForPackage = (packageName) => `<rootDir>/packages/${packageName}/**/*.test.[jt]s?(x)`

const package = (displayName, packageNames, config = {}) => ({
  roots: ['<rootDir>/packages'],
  displayName,
  testMatch: packageNames.map(testsForPackage),
  ...config
})

module.exports = {
  projects: [
    package('core', ['core']),
    package('shared plugins', ['plugin-app-duration']),
    package('browser', [
      'browser',
      'delivery-x-domain-request',
      'delivery-xml-http-request',
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
      'plugin-simple-throttle',
      'plugin-console-breadcrumbs',
      'plugin-browser-session'
    ]),
    package('react native', [
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
      ]
    }),
    package('expo', [
      'delivery-expo',
      'expo',
      'expo-cli',
      'plugin-expo-app',
      'plugin-expo-device'
    ]),
    package('node plugins', [
      'delivery-node',
      'plugin-express',
      'plugin-koa',
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
    package('node integration tests', [
    ], {
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/packages/node/test/integration/**/*.test.[jt]s'
      ]
    }),
    package('react native cli', ['react-native-cli'], { testEnvironment: 'node' })
  ]
}
