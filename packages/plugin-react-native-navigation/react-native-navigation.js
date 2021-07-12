module.exports = class BugsnagPluginReactNativeNavigation {
  constructor (Navigation) {
    if (!Navigation) {
      throw new Error(
        '@bugsnag/plugin-react-native-navigation reference to `Navigation` was undefined'
      )
    }

    this.Navigation = Navigation
  }

  load (client) {
    let lastComponent

    this.Navigation.events().registerComponentDidAppearListener(event => {
      client.setContext(event.componentName)

      if (lastComponent !== event.componentName && client._isBreadcrumbTypeEnabled('navigation')) {
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
