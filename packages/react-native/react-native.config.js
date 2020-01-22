module.exports = {
  dependency: {
    platforms: {
      ios: {
        sharedLibraries: ['libz']
      },
      android: {
        packageInstance: 'new BugsnagPackage()',
        packageImportPath: 'import com.bugsnag.reactnative.BugsnagPackage;'
      }
    },
    assets: [],
    hooks: {}
  }
}
