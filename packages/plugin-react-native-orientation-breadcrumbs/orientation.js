const { Dimensions } = require('react-native')

module.exports = {
  init: client => {
    const explicitlyDisabled = client.config.orientationBreadcrumbsEnabled === false
    const implicitlyDisabled = client.config.autoBreadcrumbs === false && client.config.orientationBreadcrumbsEnabled !== true
    if (explicitlyDisabled || implicitlyDisabled) return

    let lastOrientation

    const getCurrentOrientation = () => {
      const { height, width } = Dimensions.get('screen')
      if (height > width) {
        return 'portrait'
      } else if (height < width) {
        return 'landscape'
      } else {
        return undefined
      }
    }

    const updateOrientation = () => {
      const newOrientation = getCurrentOrientation()

      if (lastOrientation !== newOrientation) {
        client.leaveBreadcrumb(
          'Orientation changed',
          { from: lastOrientation, to: newOrientation },
          'state'
        )
        lastOrientation = newOrientation
      }
    }

    lastOrientation = getCurrentOrientation()
    Dimensions.addEventListener('change', updateOrientation)
  },
  configSchema: {
    orientationBreadcrumbsEnabled: {
      defaultValue: () => undefined,
      validate: (value) => value === true || value === false || value === undefined,
      message: 'should be true|false'
    }
  }
}
