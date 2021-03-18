module.exports = (_window = window) => ({
  load (client) {
    const updateOnlineStatus = () => {
      const online = _window.navigator.onLine

      if (client.getMetadata('device', 'online') !== online) {
        client.addMetadata('device', { online })
      }
    }

    _window.addEventListener('online', updateOnlineStatus)
    _window.addEventListener('offline', updateOnlineStatus)

    updateOnlineStatus()
  }
})
