module.exports = class BugsnagPluginReactNativeNavigation {
  constructor (Navigation) {
    this.Navigation = Navigation
  }

  load (client) {
    this.Navigation.events().registerComponentDidAppearListener(event => {
      client.setContext(event.componentName)
    })
  }
}
