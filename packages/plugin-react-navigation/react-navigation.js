const React = require('react')

class Plugin {
  constructor () {
    this.name = 'reactNavigation'
  }

  load (client) {
    const createNavigationContainer = (NavigationContainer) => React.forwardRef((props, ref) => {
      const { onReady, onStateChange, ...forwardProps } = props
      const navigationRef = ref || React.useRef(null)
      const routeNameRef = React.useRef(undefined)

      const wrappedOnReady = (...args) => {
        const currentRoute = navigationRef.current ? navigationRef.current.getCurrentRoute() : null
        if (currentRoute) {
          routeNameRef.current = currentRoute.name
          client.setContext(currentRoute.name)
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
            if (client._config.enabledBreadcrumbTypes && client._config.enabledBreadcrumbTypes.includes('navigation')) {
              client.leaveBreadcrumb(
                'React Navigation onStateChange',
                { to: currentRouteName, from: previousRouteName },
                'navigation'
              )
            }
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

module.exports = Plugin
