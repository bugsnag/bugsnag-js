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

    client._logger.info('RN navigation: loading client. enabledBreadcrumbTypes=' + client._config.enabledBreadcrumbTypes)

    // notify with information about enabledBreadcrumbTypes
    client.notify(new Error('NavBreadcrumbLoad'), event => {
      event.addMetadata('extra', {
        enabledBreadcrumbTypes: client._config.enabledBreadcrumbTypes
      })
    })

    this.Navigation.events().registerComponentDidAppearListener(event => {
      client.setContext(event.componentName)
      client._logger.info('RN navigation: nav callback. enabledBreadcrumbTypes=' + client._config.enabledBreadcrumbTypes)
      client._logger.info('RN navigation: nav callback. componentName=' + event.componentName)

      // notify with information about callback state
      client.notify(new Error('NavBreadcrumbCb'), event => {
        event.addMetadata('extra', {
          componentName: event.componentName
        })
      })

      if (
        client._config.enabledBreadcrumbTypes &&
        client._config.enabledBreadcrumbTypes.includes('navigation') &&
        lastComponent !== event.componentName
      ) {
        client._logger.info('RN navigation: nav callback. leaving breadcrumb')
        client.leaveBreadcrumb(
          'React Native Navigation componentDidAppear',
          { to: event.componentName, from: lastComponent },
          'state' // FIXME altered type
        )
      }

      lastComponent = event.componentName
    })
  }
}
