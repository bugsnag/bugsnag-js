const testsForPackage = (packageName) => `<rootDir>/packages/${packageName}/**/*.test.[jt]s`

module.exports = {
  projects: [
    {
      displayName: 'core packages',
      testMatch: [
        testsForPackage('core')
      ]
    }
  ]
}
