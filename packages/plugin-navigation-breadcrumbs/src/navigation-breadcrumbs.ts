import { Client, Plugin } from '@bugsnag/core'

interface PluginClient extends Client {
  _isBreadcrumbTypeEnabled: (type: string) => boolean
}

type ExtendedHistory = History & {
  replaceState: History['replaceState'] & { _restore?: () => void }
  pushState: History['pushState'] & { _restore?: () => void }
}

type ExtendedWindow = Window & {
  history: ExtendedHistory
}

/*
* Leaves breadcrumbs when navigation methods are called or events are emitted
*/
export default (win = window): Plugin => {
  const plugin: Plugin = {
    load: (client) => {
      if (!('addEventListener' in win)) return
      if (!(client as PluginClient)._isBreadcrumbTypeEnabled('navigation')) return

      // returns a function that will drop a breadcrumb with a given name
      const drop = (name: string) => () => client.leaveBreadcrumb(name, {}, 'navigation')

      // simple drops – just names, no meta
      win.addEventListener('pagehide', drop('Page hidden'), true)
      win.addEventListener('pageshow', drop('Page shown'), true)
      win.addEventListener('load', drop('Page loaded'), true)
      win.document.addEventListener('DOMContentLoaded', drop('DOMContentLoaded'), true)
      // some browsers like to emit popstate when the page loads, so only add the popstate listener after that
      win.addEventListener('load', () => win.addEventListener('popstate', drop('Navigated back'), true))

      // hashchange has some metadata that we care about
      win.addEventListener('hashchange', event => {
        const metadata = event.oldURL
          ? { from: relativeLocation(event.oldURL, win), to: relativeLocation(event.newURL, win), state: getCurrentState(win) }
          : { to: relativeLocation(win.location.href, win) }
        client.leaveBreadcrumb('Hash changed', metadata, 'navigation')
      }, true)

      // the only way to know about replaceState/pushState is to wrap them… >_<
      if (typeof win.history.pushState === 'function') wrapHistoryFn(client, win.history, 'pushState', win, true)
      if (typeof win.history.replaceState === 'function') wrapHistoryFn(client, win.history, 'replaceState', win)
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    plugin.destroy = (win: ExtendedWindow = window) => {
      if (win.history.replaceState._restore) win.history.replaceState._restore()
      if (win.history.pushState._restore) win.history.pushState._restore()
    }
  }

  return plugin
}

if (process.env.NODE_ENV !== 'production') {
  exports.destroy = (win: ExtendedWindow = window) => {
    if (win.history.replaceState._restore) win.history.replaceState._restore()
    if (win.history.pushState._restore) win.history.pushState._restore()
  }
}

// takes a full url like http://foo.com:1234/pages/01.html?yes=no#section-2 and returns
// just the path and hash parts, e.g. /pages/01.html?yes=no#section-2
const relativeLocation = (url: string, win: Window) => {
  const a = win.document.createElement('a')
  a.href = url
  return `${a.pathname}${a.search}${a.hash}`
}

const stateChangeToMetadata = (win: Window, state: string, title: string, url?: string | URL | null) => {
  const currentPath = relativeLocation(win.location.href, win)
  return { title, state, prevState: getCurrentState(win), to: url || currentPath, from: currentPath }
}

type HistoryMethods = 'pushState' | 'replaceState'
const wrapHistoryFn = (client: Client, target: ExtendedHistory, fn: HistoryMethods, win: Window, resetEventCount = false) => {
  const orig = target[fn]
  target[fn] = (state, title, url) => {
    client.leaveBreadcrumb(`History ${fn}`, stateChangeToMetadata(win, state, title, url), 'navigation')
    // if throttle plugin is in use, reset the event sent count
    if (resetEventCount && typeof client.resetEventCount === 'function') client.resetEventCount()
    // Internet Explorer will convert `undefined` to a string when passed, causing an unintended redirect
    // to '/undefined'. therefore we only pass the url if it's not undefined.
    orig.apply(target, [state, title].concat(url !== undefined ? url : []) as Parameters<History[HistoryMethods]>)
  }
  if (process.env.NODE_ENV !== 'production') {
    target[fn]._restore = () => { target[fn] = orig }
  }
}

const getCurrentState = (win: Window) => {
  try {
    return win.history.state
  } catch (e) {}
}
