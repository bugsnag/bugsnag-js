import { Client } from '@bugsnag/core'

const MAX_LINE_LENGTH = 200
const MAX_SCRIPT_LENGTH = 500000

export default (doc = document, win = window) => ({
  load: (client: Client) => {
    // @ts-expect-error trackInlineScripts is defined in this plugin's configSchema, not in core Config
    if (!client._config.trackInlineScripts) return

    const originalLocation = win.location.href
    let html = ''

    // in IE8-10 the 'interactive' state can fire too soon (before scripts have finished executing), so in those
    // we wait for the 'complete' state before assuming that synchronous scripts are no longer executing
    // @ts-expect-error attachEvent exists on Document in old IE but not in modern type definitions
    const isOldIe = !!doc.attachEvent
    let DOMContentLoaded = isOldIe ? doc.readyState === 'complete' : doc.readyState !== 'loading'
    const getHtml = () => doc.documentElement.outerHTML

    // get whatever HTML exists at this point in time
    html = getHtml()
    const prev = doc.onreadystatechange
    // then update it when the DOM content has loaded
    doc.onreadystatechange = function () {
      // IE8 compatible alternative to document#DOMContentLoaded
      if (doc.readyState === 'interactive') {
        html = getHtml()
        DOMContentLoaded = true
      }
      // @ts-expect-error IArguments is not assignable to the expected parameter type for apply
      try { prev?.apply(this, arguments) } catch (e) {}
    }

    let _lastScript: HTMLOrSVGScriptElement | null = null
    const updateLastScript = (script: HTMLOrSVGScriptElement | null) => {
      _lastScript = script
    }

    const getCurrentScript = () => {
      let script = doc.currentScript || _lastScript
      if (!script && !DOMContentLoaded) {
        const scripts = doc.scripts || doc.getElementsByTagName('script')
        script = scripts[scripts.length - 1]
      }
      return script
    }

    const addSurroundingCode = (lineNumber: number) => {
      // get whatever html has rendered at this point
      if (!DOMContentLoaded || !html) html = getHtml()
      // simulate the raw html
      const htmlLines = ['<!-- DOC START -->'].concat(html.split('\n'))
      const zeroBasedLine = lineNumber - 1
      const start = Math.max(zeroBasedLine - 3, 0)
      const end = Math.min(zeroBasedLine + 3, htmlLines.length)
      return htmlLines.slice(start, end).reduce((accum: Record<string, any>, line, i) => {
        accum[start + 1 + i] = line.length <= MAX_LINE_LENGTH ? line : line.substr(0, MAX_LINE_LENGTH)
        return accum
      }, {})
    }

    client.addOnError(event => {
      // remove any of our own frames that may be part the stack this
      // happens before the inline script check as it happens for all errors
      // @ts-expect-error f.method may be undefined but regex test handles it at runtime
      event.errors[0].stacktrace = event.errors[0].stacktrace.filter(f => !(/__trace__$/.test(f.method)))

      const frame = event.errors[0].stacktrace[0]

      // remove hash and query string from url
      const cleanUrl = (url: string) => url.replace(/#.*$/, '').replace(/\?.*$/, '')

      // if frame.file exists and is not the original location of the page, this can't be an inline script
      if (frame && frame.file && cleanUrl(frame.file) !== cleanUrl(originalLocation)) return

      // grab the last script known to have run
      const currentScript = getCurrentScript()
      if (currentScript) {
        const content = currentScript.innerHTML
        event.addMetadata(
          'script',
          'content',
          content.length <= MAX_SCRIPT_LENGTH ? content : content.substr(0, MAX_SCRIPT_LENGTH)
        )

        // only attempt to grab some surrounding code if we have a line number
        if (frame && frame.lineNumber) {
          frame.code = addSurroundingCode(frame.lineNumber)
        }
      }
    }, true)

    // Proxy all the timer functions whose callback is their 0th argument.
    // Keep a reference to the original setTimeout because we need it later
    const [_setTimeout] = [
      'setTimeout',
      'setInterval',
      'setImmediate',
      'requestAnimationFrame'
    ].map(fn =>
      __proxy(win, fn, original =>
        __traceOriginalScript(original, (args: any) => ({
          get: () => args[0],
          // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
          replace: (fn: Function) => { args[0] = fn }
        }))
      )
    )

    // Proxy all the host objects whose prototypes have an addEventListener function
    const eventListeners = ['EventTarget', 'Window', 'Node', 'ApplicationCache', 'AudioTrackList', 'ChannelMergerNode', 'CryptoOperation', 'EventSource', 'FileReader', 'HTMLUnknownElement', 'IDBDatabase',
      'IDBRequest', 'IDBTransaction', 'KeyOperation', 'MediaController', 'MessagePort', 'ModalWindow',
      'Notification', 'SVGElementInstance', 'Screen', 'TextTrack', 'TextTrackCue', 'TextTrackList',
      'WebSocket', 'WebSocketWorker', 'Worker', 'XMLHttpRequest', 'XMLHttpRequestEventTarget', 'XMLHttpRequestUpload',
	  'MediaSource', 'MediaRecorder', 'MediaStream', 'ServiceWorker', 'ServiceWorkerContainer',
      'ServiceWorkerRegistration', 'BroadcastChannel', 'RTCPeerConnection', 'RTCDataChannel', 'AbortSignal',
      'MediaQueryList', 'ShadowRoot', 'FontFaceSet', 'Animation', 'PermissionStatus', 'PaymentRequest', 'VideoTrackList'
    ]

    eventListeners.map(o => {
      // @ts-expect-error indexing Window with a string to access global constructors dynamically
      if (!win[o] || !win[o].prototype || !Object.prototype.hasOwnProperty.call(win[o].prototype, 'addEventListener')) return
      // @ts-expect-error indexing Window with a string to access global constructors dynamically
      __proxy(win[o].prototype, 'addEventListener', original =>
        __traceOriginalScript(original, eventTargetCallbackAccessor)
      )
      // @ts-expect-error indexing Window with a string to access global constructors dynamically
      __proxy(win[o].prototype, 'removeEventListener', original =>
        __traceOriginalScript(original, eventTargetCallbackAccessor, true)
      )
    })

    function __traceOriginalScript<T extends (...args: any[]) => any> (
      fn: T,
      callbackAccessor: (args: Parameters<T>) => { get: () => any, replace: (fn: any) => void },
      alsoCallOriginal = false
    ) {
      return function (...args: Parameters<T>) {
        // this is required for removeEventListener to remove anything added with
        // addEventListener before the functions started being wrapped by Bugsnag
        try {
          const cba = callbackAccessor(args)
          const cb = cba.get()
          // @ts-expect-error 'this' is implicitly any in this dynamic function wrapper context
          if (alsoCallOriginal) fn.apply(this, args)
          // @ts-expect-error 'this' is implicitly any in this dynamic function wrapper context
          if (typeof cb !== 'function') return fn.apply(this, args)
          if (cb.__trace__) {
            cba.replace(cb.__trace__)
          } else {
            const script = getCurrentScript()
            // this function mustn't be annonymous due to a bug in the stack
            // generation logic, meaning it gets tripped up
            // see: https://github.com/stacktracejs/stack-generator/issues/6
            cb.__trace__ = function __trace__ (...cbArgs: any[]) {
              // set the script that called this function
              updateLastScript(script)
              // immediately unset the currentScript synchronously below, however
              // if this cb throws an error the line after will not get run so schedule
              // an almost-immediate aysnc update too
              _setTimeout(function () { updateLastScript(null) }, 0)
              const ret = cb.apply(this, cbArgs)
              updateLastScript(null)
              return ret
            }
            cb.__trace__.__trace__ = cb.__trace__
            cba.replace(cb.__trace__)
          }
        } catch (e) {
          // swallow these errors on Selenium:
          // Permission denied to access property '__trace__'
          // WebDriverException: Message: Permission denied to access property "handleEvent"
        }
        // IE8 doesn't let you call .apply() on setTimeout/setInterval
        // @ts-expect-error 'this' is implicitly any in this dynamic function wrapper context
        if (fn.apply) return fn.apply(this, args)
        switch (args.length) {
          case 1: return fn(args[0])
          case 2: return fn(args[0], args[1])
          default: return fn()
        }
      }
    }
  },
  configSchema: {
    trackInlineScripts: {
      validate: (value: unknown) => value === true || value === false,
      defaultValue: () => true,
      message: 'should be true|false'
    }
  }
})

function __proxy<T extends (...args: any[]) => any> (host: any, name: string, replacer: (fn: T) => T) {
  const original = host[name] as T
  if (!original) return original
  const replacement = replacer(original)
  host[name] = replacement
  return original
}

function eventTargetCallbackAccessor (args: any) {
  const isEventHandlerObj = !!args[1] && typeof args[1].handleEvent === 'function'
  return {
    get: function () {
      return isEventHandlerObj ? args[1].handleEvent : args[1]
    },
    replace: function (fn: any) {
      if (isEventHandlerObj) {
        args[1].handleEvent = fn
      } else {
        args[1] = fn
      }
    }
  }
}
