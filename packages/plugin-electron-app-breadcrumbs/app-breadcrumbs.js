const debounce = require('lodash.debounce')
const debounceOptions = { leading: true }

const BREADCRUMB_STATE = 'state'
const BREADCRUMB_ERROR = 'error'

module.exports = (app, BrowserWindow) => ({
  load (client) {
    if (client._config.enabledBreadcrumbTypes.includes(BREADCRUMB_STATE)) {
      registerStateBreadcrumbListeners(client, app, BrowserWindow)
    }

    if (client._config.enabledBreadcrumbTypes.includes(BREADCRUMB_ERROR)) {
      registerErrorBreadcrumbListeners(client, app)
    }
  }
})

function registerStateBreadcrumbListeners (client, app, BrowserWindow) {
  app.on('ready', () => {
    client.leaveBreadcrumb('App became ready', undefined, BREADCRUMB_STATE)
  })

  app.on('will-quit', () => {
    client.leaveBreadcrumb('App is quitting', undefined, BREADCRUMB_STATE)
  })

  app.on('browser-window-blur', (_event, browserWindow) => {
    client.leaveBreadcrumb(
      `Browser window ${browserWindow.id} lost focus`,
      { id: browserWindow.id, title: browserWindow.title },
      BREADCRUMB_STATE
    )
  })

  app.on('browser-window-focus', (_event, browserWindow) => {
    client.leaveBreadcrumb(
      `Browser window ${browserWindow.id} gained focus`,
      { id: browserWindow.id, title: browserWindow.title },
      BREADCRUMB_STATE
    )
  })

  const leaveBrowserWindowBreadcrumb = (action, browserWindow, extras = {}) => {
    client.leaveBreadcrumb(
      `Browser window ${browserWindow.id} ${action}`,
      { id: browserWindow.id, title: browserWindow.title, ...extras },
      BREADCRUMB_STATE
    )
  }

  app.on('browser-window-created', (_event, browserWindow) => {
    client.leaveBreadcrumb(
      `Browser window ${browserWindow.id} created`,
      { id: browserWindow.id, title: browserWindow.title },
      BREADCRUMB_STATE
    )

    // attach listeners to the new window
    attachBrowserWindowListeners(leaveBrowserWindowBreadcrumb, browserWindow)
  })

  // attach listeners to any windows that are already open
  BrowserWindow.getAllWindows().forEach(browserWindow => {
    attachBrowserWindowListeners(leaveBrowserWindowBreadcrumb, browserWindow)
  })
}

function attachBrowserWindowListeners (leaveBreadcrumb, browserWindow) {
  // when the 'closed' event fires we aren't allowed to read from the browserWindow,
  // so we cache the values we care about in the 'close' event instead
  // we don't use the close event for the breadcrumb as it can be cancelled
  const lastKnownState = { id: browserWindow.id, title: browserWindow.title }

  browserWindow.on('close', () => {
    lastKnownState.id = browserWindow.id
    lastKnownState.title = browserWindow.title
  })

  browserWindow.on('closed', () => {
    leaveBreadcrumb('closed', lastKnownState)
  })

  browserWindow.on('unresponsive', () => {
    leaveBreadcrumb('became unresponsive', browserWindow)
  })

  browserWindow.on('responsive', () => {
    leaveBreadcrumb('became responsive', browserWindow)
  })

  browserWindow.on('show', () => {
    leaveBreadcrumb('was shown', browserWindow)
  })

  browserWindow.on('hide', () => {
    leaveBreadcrumb('was hidden', browserWindow)
  })

  browserWindow.on('maximize', () => {
    leaveBreadcrumb('was maximized', browserWindow)
  })

  browserWindow.on('minimize', () => {
    leaveBreadcrumb('was minimized', browserWindow)
  })

  browserWindow.on('resized', () => {
    const [width, height] = browserWindow.getSize()

    leaveBreadcrumb('was resized', browserWindow, { width, height })
  })

  // the moved event fires too frequently to add a breadcrumb each time
  browserWindow.on('moved', debounce(() => {
    const [left, top] = browserWindow.getPosition()

    leaveBreadcrumb('was moved', browserWindow, { left, top })
  }, 250, debounceOptions))

  browserWindow.on('enter-full-screen', () => {
    leaveBreadcrumb('went full-screen', browserWindow)
  })

  browserWindow.on('leave-full-screen', () => {
    leaveBreadcrumb('left full-screen', browserWindow)
  })
}

function registerErrorBreadcrumbListeners (client, app) {
  app.on('child-process-gone', (_event, details) => {
    const message = details.name
      ? `${details.name} (${details.type}) child process unexpectedly disappeared`
      : `${details.type} child process unexpectedly disappeared`

    client.leaveBreadcrumb(
      message,
      { reason: details.reason, exitCode: details.exitCode },
      BREADCRUMB_ERROR
    )
  })

  app.on('render-process-gone', (_event, webContents, details) => {
    client.leaveBreadcrumb(
      'Renderer process unexpectedly disappeared',
      { webContentsId: webContents.id, reason: details.reason, exitCode: details.exitCode },
      BREADCRUMB_ERROR
    )
  })
}
