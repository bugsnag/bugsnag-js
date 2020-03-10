const { Dimensions } = require('react-native')

module.exports = {
  load: client => {
    if (!client._config.enabledBreadcrumbTypes || !client._config.enabledBreadcrumbTypes.includes('state')) return

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
  }
}
