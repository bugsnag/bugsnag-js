const { includes } = require('@bugsnag/core/lib/es-utils')

/*
 * Leaves breadcrumbs when navigation methods are called or events are emitted
 */
exports.init = (client, win = window) => {
  if (!('addEventListener' in win)) return

  if (!client._config.enabledBreadcrumbTypes || !includes(client._config.enabledBreadcrumbTypes, 'navigation')) return

  // returns a function that will drop a breadcrumb with a given name
  const drop = name => () => client.leaveBreadcrumb(name, {}, 'navigation')

  // simple drops – just names, no meta
  win.addEventListener('pagehide', drop('Page hidden'), true)
  win.addEventListener('pageshow', drop('Page shown'), true)
  win.addEventListener('load', drop('Page loaded'), true)
  win.document.addEventListener('DOMContentLoaded', drop('DOMContentLoaded'), true)
  // some browsers like to emit popstate when the page loads, so only add the popstate listener after that
  win.addEventListener('load', () => win.addEventListener('popstate', drop('Navigated back'), true))

  // hashchange has some metaData that we care about
  win.addEventListener('hashchange', event => {
    const metaData = event.oldURL
      ? { from: relativeLocation(event.oldURL, win), to: relativeLocation(event.newURL, win), state: getCurrentState(win) }
      : { to: relativeLocation(win.location.href, win) }
    client.leaveBreadcrumb('Hash changed', metaData, 'navigation')
  }, true)

  // the only way to know about replaceState/pushState is to wrap them… >_<

  if (win.history.replaceState) wrapHistoryFn(client, win.history, 'replaceState', win)
  if (win.history.pushState) wrapHistoryFn(client, win.history, 'pushState', win)

  client.leaveBreadcrumb('Bugsnag loaded', {}, 'navigation')
}

if (process.env.NODE_ENV !== 'production') {
  exports.destroy = (win = window) => {
    win.history.replaceState._restore()
    win.history.pushState._restore()
  }
}

// takes a full url like http://foo.com:1234/pages/01.html?yes=no#section-2 and returns
// just the path and hash parts, e.g. /pages/01.html?yes=no#section-2
const relativeLocation = (url, win) => {
  const a = win.document.createElement('A')
  a.href = url
  return `${a.pathname}${a.search}${a.hash}`
}

const stateChangeToMetaData = (win, state, title, url) => {
  const currentPath = relativeLocation(win.location.href, win)
  return { title, state, prevState: getCurrentState(win), to: url || currentPath, from: currentPath }
}

const wrapHistoryFn = (client, target, fn, win) => {
  const orig = target[fn]
  target[fn] = (state, title, url) => {
    client.leaveBreadcrumb(`History ${fn}`, stateChangeToMetaData(win, state, title, url), 'navigation')
    // if throttle plugin is in use, refresh the event sent count
    if (typeof client.refresh === 'function') client.refresh()
    // if the client is operating in auto session-mode, a new route should trigger a new session
    if (client._config.autoTrackSessions) client.startSession()
    // Internet Explorer will convert `undefined` to a string when passed, causing an unintended redirect
    // to '/undefined'. therefore we only pass the url if it's not undefined.
    orig.apply(target, [state, title].concat(url !== undefined ? url : []))
  }
  if (process.env.NODE_ENV !== 'production') {
    target[fn]._restore = () => { target[fn] = orig }
  }
}

const getCurrentState = (win) => {
  try {
    return win.history.state
  } catch (e) {}
}
