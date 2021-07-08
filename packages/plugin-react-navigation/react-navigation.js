const React = require('react')

class BugsnagPluginReactNavigation {
  constructor () {
    this.name = 'reactNavigation'
  }

  load (client) {
    client._logger.info('RN navigation: loading client. enabledBreadcrumbTypes=' + client._config.enabledBreadcrumbTypes)

    const leaveBreadcrumb = (event, currentRouteName, previousRouteName) => {
      client._logger.info('RN navigation: leaveBreadcrumb called')
      if (client._config.enabledBreadcrumbTypes && client._config.enabledBreadcrumbTypes.includes('navigation')) {
        client._logger.info('RN navigation: leaveBreadcrumb called, no discard happening')
        client.leaveBreadcrumb(
          `React Navigation ${event}`,
          { to: currentRouteName, from: previousRouteName },
          'navigation'
        )
      }
    }

    const createNavigationContainer = (NavigationContainer) => React.forwardRef((props, ref) => {
      const { onReady, onStateChange, ...forwardProps } = props
      const navigationRef = ref || React.useRef(null)
      const routeNameRef = React.useRef(undefined)

      const wrappedOnReady = (...args) => {
        const currentRoute = navigationRef.current ? navigationRef.current.getCurrentRoute() : null
        if (currentRoute) {
          const currentRouteName = currentRoute.name
          client.setContext(currentRouteName)
          leaveBreadcrumb('onReady', currentRouteName, undefined)
          routeNameRef.current = currentRouteName
        }
        if (typeof onReady === 'function') onReady.apply(this, args)
      }

      const wrappedOnStateChange = (...args) => {
        const previousRouteName = routeNameRef.current
        const currentRoute = navigationRef.current ? navigationRef.current.getCurrentRoute() : null

        if (currentRoute) {
          const currentRouteName = currentRoute.name

          if (previousRouteName !== currentRouteName) {
            client.setContext(currentRouteName)
            leaveBreadcrumb('onStateChange', currentRouteName, previousRouteName)
          }

          routeNameRef.current = currentRouteName
        }
        if (typeof onStateChange === 'function') onStateChange.apply(this, args)
      }

      return React.createElement(NavigationContainer, {
        ref: navigationRef,
        onReady: wrappedOnReady,
        onStateChange: wrappedOnStateChange,
        ...forwardProps
      })
    })
    return { createNavigationContainer }
  }
}

module.exports = BugsnagPluginReactNavigation
