/*
 * Leaves breadcrumbs when navigation methods are called or events are emitted
 */
module.exports = {
  init: (client, BugsnagReport, BugsnagBreadcrumb) => {
    // returns a function that will drop a breadcrumb with a given name
    const drop = name => () => client.leaveBreadcrumb(new BugsnagBreadcrumb('navigation', name))

    // simple drops – just names, no meta
    window.addEventListener('popstate', drop('Navigated back'), true)
    window.addEventListener('pagehide', drop('Page hidden'), true)
    window.addEventListener('pageshow', drop('Page shown'), true)
    window.addEventListener('load', drop('Page loaded'), true)
    window.addEventListener('DOMContentLoaded', drop('DOMContentLoaded'), true)

    // hashchange has some metaData that we care about
    window.addEventListener('hashchange', event => {
      const metaData = event.oldURL
        ? { from: relativeLocation(event.oldURL), to: relativeLocation(event.newURL), state: window.history.state }
        : { to: relativeLocation(window.location.href) }
      client.leaveBreadcrumb(new BugsnagBreadcrumb('navigation', 'Hash changed', metaData))
    }, true)

    // the only way to know about replaceState/pushState is to wrap them… >_<

    const _replaceState = window.history.replaceState
    window.history.replaceState = (state, title, url) => {
      client.leaveBreadcrumb(new BugsnagBreadcrumb('navigation', 'History replaceState', stateChangeToMetaData(state, title, url)))
      _replaceState.call(window.history, state, title, url)
    }
    window.history.replaceState._restore = () => {
      window.history.replaceState = _replaceState
    }

    const _pushState = window.history.pushState
    window.history.pushState = (state, title, url) => {
      client.leaveBreadcrumb(new BugsnagBreadcrumb('navigation', 'History replaceState', stateChangeToMetaData(state, title, url)))
      _pushState.call(window.history, state, title, url)
    }
    window.history.pushState._restore = () => {
      window.history.pushState = _pushState
    }

    client.leaveBreadcrumb(new BugsnagBreadcrumb('navigation', 'Bugsnag loaded'))
  },
  destroy: () => {
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
