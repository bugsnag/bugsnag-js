const BREADCRUMB_STATE = 'state'

module.exports = (powerMonitor) => ({
  load (client) {
    if (!client._isBreadcrumbTypeEnabled(BREADCRUMB_STATE)) {
      return
    }

    powerMonitor.on('suspend', () => {
      client.leaveBreadcrumb('Device suspended', undefined, BREADCRUMB_STATE)
    })

    powerMonitor.on('resume', () => {
      client.leaveBreadcrumb('Device resumed from suspension', undefined, BREADCRUMB_STATE)
    })

    powerMonitor.on('on-ac', () => {
      client.leaveBreadcrumb('Device connected to mains power source', undefined, BREADCRUMB_STATE)
    })

    powerMonitor.on('on-battery', () => {
      client.leaveBreadcrumb('Device switched to battery power source', undefined, BREADCRUMB_STATE)
    })

    powerMonitor.on('shutdown', () => {
      client.leaveBreadcrumb('Device about to shutdown', undefined, BREADCRUMB_STATE)
    })

    powerMonitor.on('lock-screen', () => {
      client.leaveBreadcrumb('Device screen locked', undefined, BREADCRUMB_STATE)
    })

    powerMonitor.on('unlock-screen', () => {
      client.leaveBreadcrumb('Device screen unlocked', undefined, BREADCRUMB_STATE)
    })
  }
})
