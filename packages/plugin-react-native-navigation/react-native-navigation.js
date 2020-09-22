module.exports = class BugsnagPluginReactNativeNavigation {
  constructor (Navigation) {
    this.Navigation = Navigation
  }

  load (client) {
    let lastComponent

    this.Navigation.events().registerComponentDidAppearListener(event => {
      client.setContext(event.componentName)

      if (lastComponent !== event.componentName) {
        client.leaveBreadcrumb(
          'React Native Navigation componentDidAppear',
          { to: event.componentName, from: lastComponent },
          'navigation'
        )
      }

      lastComponent = event.componentName
    })
  }
}
