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
        testsForPackage('plugin-browser-device')
      ]
    },
    {
      displayName: 'react native',
      preset: 'react-native',
      testMatch: [
        testsForPackage('react-native'),
        testsForPackage('plugin-react-native-app-state-breadcrumbs'),
        testsForPackage('plugin-react-native-unhandled-rejection')
      ],
      setupFiles: [
        require.resolve('react-native/Libraries/Core/setUpGlobals.js'),
        require.resolve('react-native/Libraries/Core/setUpXHR.js'),
        '<rootDir>/packages/react-native/src/test/setup.js'
      ]
    },
    {
      displayName: 'node plugins',
      testEnvironment: 'node',
      testMatch: [
        testsForPackage('plugin-server-*')
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
