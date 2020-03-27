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
        testsForPackage('plugin-react')
      ]
    },
    {
      displayName: 'react native',
      preset: 'react-native',
      testMatch: [
        testsForPackage('react-native'),
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
