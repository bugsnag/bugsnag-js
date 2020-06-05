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
      displayName: 'browser plugins',
      testMatch: [
        testsForPackage('plugin-react'),
        testsForPackage('plugin-vue'),
        testsForPackage('plugin-browser-context'),
        testsForPackage('plugin-browser-device'),
        testsForPackage('plugin-strip-query-string')
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
        testsForPackage('plugin-server-*')
      ]
    }
  ]
}
