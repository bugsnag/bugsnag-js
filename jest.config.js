const testsForPackage = (packageName) => `<rootDir>/packages/${packageName}/**/*.test.[jt]s?(x)`

module.exports = {
  projects: [
    {
      displayName: 'core',
      testMatch: [
        testsForPackage('core')
      ]
    },
    {
      displayName: 'shared plugins',
      testMatch: [
        testsForPackage('plugin-app-duration')
      ]
    },
    {
      displayName: 'browser',
      testMatch: [
        testsForPackage('browser'),
        testsForPackage('delivery-x-domain-request'),
        testsForPackage('delivery-xml-http-request'),
        testsForPackage('plugin-react'),
        testsForPackage('plugin-vue'),
        testsForPackage('plugin-browser-context'),
        testsForPackage('plugin-browser-device'),
        testsForPackage('plugin-browser-request'),
        testsForPackage('plugin-client-ip'),
        testsForPackage('plugin-navigation-breadcrumbs'),
        testsForPackage('plugin-network-breadcrumbs'),
        testsForPackage('plugin-window-unhandled-rejection'),
        testsForPackage('plugin-window-onerror'),
        testsForPackage('plugin-strip-query-string'),
        testsForPackage('plugin-interaction-breadcrumbs'),
        testsForPackage('plugin-simple-throttle'),
        testsForPackage('plugin-console-breadcrumbs'),
        testsForPackage('plugin-browser-session')
      ]
    },
    {
      displayName: 'react native',
      preset: 'react-native',
      testMatch: [
        testsForPackage('react-native'),
        testsForPackage('delivery-react-native'),
        testsForPackage('plugin-react-native-app-state-breadcrumbs'),
        testsForPackage('plugin-react-native-connectivity-breadcrumbs'),
        testsForPackage('plugin-react-native-orientation-breadcrumbs'),
        testsForPackage('plugin-react-native-unhandled-rejection'),
        testsForPackage('plugin-react-native-hermes'),
        testsForPackage('plugin-react-native-client-sync'),
        testsForPackage('plugin-react-native-event-sync'),
        testsForPackage('plugin-react-native-global-error-handler'),
        testsForPackage('plugin-react-native-session'),
        testsForPackage('plugin-react-navigation'),
        testsForPackage('plugin-react-native-navigation')
      ],
      setupFiles: [
        '<rootDir>/packages/react-native/src/test/setup.js'
      ]
    },
    {
      displayName: 'react native cli',
      testEnvironment: 'node',
      testMatch: [
        testsForPackage('react-native-cli')
      ]
    },
    {
      displayName: 'expo',
      testMatch: [
        testsForPackage('delivery-expo'),
        testsForPackage('expo-cli'),
        testsForPackage('plugin-expo-app'),
        testsForPackage('plugin-expo-device')
      ]
    },
    {
      displayName: 'node plugins',
      testEnvironment: 'node',
      testMatch: [
        testsForPackage('delivery-node'),
        testsForPackage('plugin-express'),
        testsForPackage('plugin-koa'),
        testsForPackage('plugin-restify'),
        testsForPackage('plugin-contextualize'),
        testsForPackage('plugin-server-*'),
        testsForPackage('plugin-strip-project-root'),
        testsForPackage('plugin-intercept'),
        testsForPackage('plugin-node-unhandled-rejection'),
        testsForPackage('plugin-node-in-project'),
        testsForPackage('plugin-node-device'),
        testsForPackage('plugin-node-surrounding-code'),
        testsForPackage('plugin-node-uncaught-exception')
      ]
    },
    {
      displayName: 'node integration tests',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/packages/node/test/integration/**/*.test.[jt]s'
      ]
    }
  ]
}
