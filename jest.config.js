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
      displayName: 'browser plugins',
      testMatch: [
        testsForPackage('plugin-react'),
        testsForPackage('plugin-vue'),
        testsForPackage('plugin-browser-context'),
        testsForPackage('plugin-browser-device'),
        testsForPackage('plugin-browser-request'),
        testsForPackage('plugin-window-unhandled-rejection'),
        testsForPackage('plugin-window-onerror'),
        testsForPackage('plugin-strip-query-string'),
        testsForPackage('plugin-interaction-breadcrumbs'),
        testsForPackage('plugin-simple-throttle')
      ]
    },
    {
      displayName: 'react native',
      preset: 'react-native',
      testMatch: [
        testsForPackage('plugin-react-native-app-state-breadcrumbs'),
        testsForPackage('plugin-react-native-unhandled-rejection')
      ]
    },
    {
      displayName: 'node plugins',
      testEnvironment: 'node',
      testMatch: [
        testsForPackage('plugin-server-*'),
        testsForPackage('plugin-strip-project-root'),
        testsForPackage('plugin-intercept'),
        testsForPackage('plugin-node-unhandled-rejection')
      ]
    }
  ]
}
