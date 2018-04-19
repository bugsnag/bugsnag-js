/*
 * Leaves breadcrumbs when navigation methods are called or events are emitted
 */
exports.init = (client) => {
  if (!('addEventListener' in window)) return

  // returns a function that will drop a breadcrumb with a given name
  const drop = name => () => client.leaveBreadcrumb(name, {}, 'navigation')

  // simple drops – just names, no meta
  window.addEventListener('pagehide', drop('Page hidden'), true)
  window.addEventListener('pageshow', drop('Page shown'), true)
  window.addEventListener('load', drop('Page loaded'), true)
  window.document.addEventListener('DOMContentLoaded', drop('DOMContentLoaded'), true)
  // some browsers like to emit popstate when the page loads, so only add the postate listener after that
  window.addEventListener('load', () => window.addEventListener('popstate', drop('Navigated back'), true))

  // hashchange has some metaData that we care about
  window.addEventListener('hashchange', event => {
    const metaData = event.oldURL
      ? { from: relativeLocation(event.oldURL), to: relativeLocation(event.newURL), state: window.history.state }
      : { to: relativeLocation(window.location.href) }
    client.leaveBreadcrumb('Hash changed', metaData, 'navigation')
  }, true)

  // the only way to know about replaceState/pushState is to wrap them… >_<

  if (window.history.replaceState) wrapHistoryFn(client, window.history, 'replaceState')
  if (window.history.pushState) wrapHistoryFn(client, window.history, 'pushState')

  client.leaveBreadcrumb('Bugsnag loaded', {}, 'navigation')
}

exports.configSchema = {
  navigationBreadcrumbsEnabled: {
    defaultValue: () => undefined,
    validate: (value) => value === true || value === false || value === undefined,
    message: 'should be true|false'
  }
}

if (process.env.NODE_ENV !== 'production') {
  exports.destroy = () => {
    window.history.replaceState._restore()
    window.history.pushState._restore()
  }
}

// takes a full url like http://foo.com:1234/pages/01.html?yes=no#section-2 and returns
// just the path and hash parts, e.g. /pages/01.html?yes=no#section-2
const relativeLocation = url => {
  const a = document.createElement('A')
  a.href = url
  return `${a.pathname}${a.search}${a.hash}`
}

const stateChangeToMetaData = (state, title, url) => {
  const currentPath = relativeLocation(window.location.href)
  return { title, state, prevState: window.history.state, to: url || currentPath, from: currentPath }
}

const wrapHistoryFn = (client, target, fn) => {
  const orig = target[fn]
  target[fn] = (state, title, url) => {
    client.leaveBreadcrumb(`History ${fn}`, stateChangeToMetaData(state, title, url), 'navigation')
    // if throttle plugin is in use, refresh the event sent count
    if (typeof client.refresh === 'function') client.refresh()
    // if the client is operating in session-mode, a new route should trigger a new session
    if (client.session) client.startSession()
    orig.call(target, state, title, url)
  }
  target[fn]._restore = () => { target[fn] = orig }
}
