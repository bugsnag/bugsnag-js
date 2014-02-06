//
// **Bugsnag.js** is the official JavaScript notifier for
// [Bugsnag](https://bugsnag.com).
//
// Bugsnag gives you instant notification of errors and
// exceptions in your website's JavaScript code.
//
// Bugsnag.js is incredibly small, and has no external dependencies (not even
// jQuery!) so you can safely use it on any website.
//

// The `Bugsnag` object is the only globally exported variable
(function(definition) {
  var old = window.Bugsnag;
  window.Bugsnag = definition(window, document, navigator, old);
})(function (window, document, navigator, old) {
  var self = {},
      lastEvent,
      lastScript,
      shouldCatch = true,
      ignoreOnError = 0;

  self.noConflict = function() {
    window.Bugsnag = old;
    return self;
  };

  //
  // ### Manual error notification (public methods)
  //

  // #### Bugsnag.notifyException
  //
  // Notify Bugsnag about a given `exception`, typically that you've caught
  // with a `try/catch` statement or that you've generated yourself.
  //
  // Since most JavaScript exceptions use the `Error` class, we also allow
  // you to provide a custom error name when calling `notifyException`.
  self.notifyException = function (exception, name, metaData) {
    if (typeof name !== "string") {
      metaData = name || {};
    } else if (!metaData) {
      metaData = {};
    }
    addScriptToMetaData(metaData);

    sendToBugsnag({
      name: name || exception.name,
      message: exception.message || exception.description,
      stacktrace: stacktraceFromException(exception) || generateStacktrace(),
      file: exception.fileName || exception.sourceURL,
      lineNumber: exception.lineNumber || exception.line,
      columnNumber: exception.columnNumber ? exception.columnNumber + 1 : undefined
    }, metaData);
  };

  // #### Bugsnag.notify
  //
  // Notify Bugsnag about an error by passing in a `name` and `message`,
  // without requiring an exception.
  self.notify = function (name, message, metaData) {
    sendToBugsnag({
      name: name,
      message: message,
      stacktrace: generateStacktrace()
    }, metaData);
  };

  // Return a function acts like the given function, but reports
  // any exceptions to Bugsnag before re-throwing them.
  //
  // This is not a public function because it can only be used if
  // the exception is not caught after being thrown out of this function.
  //
  // If you call wrap twice on the same function, it'll give you back the
  // same wrapped function. This lets removeEventListener to continue to
  // work.
  function wrap(_super, options) {
    try {
      if (typeof _super !== "function") {
        return _super;
      }
      if (!_super.bugsnag) {
        var currentScript = getCurrentScript();
        _super.bugsnag = function (event) {
          if (options && options.eventHandler) {
            lastEvent = event;
          }
          lastScript = currentScript;

          // We set shouldCatch to false on IE < 10 because catching the error ruins the file/line as reported in window.onerror,
          // We set shouldCatch to false on Chrome/Safari because it interferes with "break on unhandled exception"
          // All other browsers need shouldCatch to be true, as they don't pass the exception object to window.onerror
          if (shouldCatch) {
            try {
              return _super.apply(this, arguments);
            } catch (e) {
              // We do this rather than stashing treating the error like lastEvent
              // because in FF 26 onerror is not called for synthesized event handlers.
              if (getSetting("autoNotify", true)) {
                self.notifyException(e);
                ignoreNextOnError();
              }
              throw e;
            } finally {
              lastScript = null;
            }
          } else {
            var ret = _super.apply(this, arguments);
            // in case of error, this is set to null in window.onerror
            lastScript = null;
            return ret;
          }
        };
        _super.bugsnag.bugsnag = _super.bugsnag;
      }
      return _super.bugsnag;

    // This can happen if _super is not a normal javascript function.
    // For example, see https://github.com/bugsnag/bugsnag-js/issues/28
    } catch (e) {
      return _super;
    }
  }

  //
  // ### Script tag tracking
  //

  // To emulate document.currentScript we use document.scripts.last.
  // This only works while synchronous scripts are running, so we track
  // that here.
  var synchronousScriptsRunning = document.readyState !== "complete";
  function loadCompleted() {
    synchronousScriptsRunning = false;
  }

  // from jQuery. We don't have quite such tight bounds as they do if
  // we end up on the window.onload event as we don't try and hack
  // the .scrollLeft() fix in because it doesn't work in frames so
  // we'd need these fallbacks anyway.
  // The worst that can happen is we group an event handler that fires
  // before us into the last script tag.
  if (document.addEventListener) {
    document.addEventListener("DOMContentLoaded", loadCompleted, true);
    window.addEventListener("load", loadCompleted, true);
  } else {
    window.attachEvent("onload", loadCompleted);
  }

  function getCurrentScript() {
    var script = document.currentScript || lastScript;

    if (!script && synchronousScriptsRunning) {
      var scripts = document.getElementsByTagName("script");
      script = scripts[scripts.length - 1];
    }

    return script;
  }

  function addScriptToMetaData(metaData) {
    var script = getCurrentScript();

    if (script) {
      metaData.script = {
        src: script.src,
        content: script.innerHTML && script.innerHTML.substr(0, 1024)
      };
    }
  }

  //
  // ### Helpers & Setup
  //

  // Compile regular expressions upfront.
  var API_KEY_REGEX = /^[0-9a-f]{32}$/i;
  var FUNCTION_REGEX = /function\s*([\w\-$]+)?\s*\(/i;

  // Set up default notifier settings.
  var DEFAULT_BASE_ENDPOINT = "https://notify.bugsnag.com/";
  var DEFAULT_NOTIFIER_ENDPOINT = DEFAULT_BASE_ENDPOINT + "js";
  var NOTIFIER_VERSION = "2.1.0";

  // Keep a reference to the currently executing script in the DOM.
  // We'll use this later to extract settings from attributes.
  var scripts = document.getElementsByTagName("script");
  var thisScript = scripts[scripts.length - 1];

  // Simple logging function that wraps `console.log` if available.
  // This is useful for warning about configuration issues
  // eg. forgetting to set an API key.
  function log(msg) {
    var console = window.console;
    if (console !== undefined && console.log !== undefined) {
      console.log("[Bugsnag] " + msg);
    }
  }

  // Deeply serialize an object into a query string. We use the PHP-style
  // nested object syntax, `nested[keys]=val`, to support heirachical
  // objects. Similar to jQuery's `$.param` method.
  function serialize(obj, prefix) {
    var str = [];
    for (var p in obj) {
      if (obj.hasOwnProperty(p) && p != null && obj[p] != null) {
        var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
        str.push(typeof v === "object" ? serialize(v, k) : encodeURIComponent(k) + "=" + encodeURIComponent(v));
      }
    }
    return str.join("&");
  }

  // Deep-merge the `source` object into the `target` object and return
  // the `target`. Properties in source that will overwrite those in target.
  // Similar to jQuery's `$.extend` method.
  function merge(target, source) {
    if (source == null) {
      return target;
    }

    target = target || {};
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        try {
          if (source[key].constructor === Object) {
            target[key] = merge(target[key], source[key]);
          } else {
            target[key] = source[key];
          }
        } catch (e) {
          target[key] = source[key];
        }
      }
    }

    return target;
  }

  // Make a HTTP request with given `url` and `params` object.
  // For maximum browser compatibility and cross-domain support, requests are
  // made by creating a temporary JavaScript `Image` object.
  function request(url, params) {
    if (typeof BUGSNAG_TESTING !== "undefined" && self.testRequest) {
      self.testRequest(url, params);
    } else {
      var img = new Image();
      img.src = url + "?" + serialize(params) + "&ct=img&cb=" + new Date().getTime();
    }
  }

  // Extract all `data-*` attributes from a DOM element and return them as an
  // object. This is used to allow Bugsnag settings to be set via attributes
  // on the `script` tag, eg. `<script data-apikey="xyz">`.
  // Similar to jQuery's `$(el).data()` method.
  function getData(node) {
    var dataAttrs = {};
    var dataRegex = /^data\-([\w\-]+)$/;
    var attrs = node.attributes;
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];
      if (dataRegex.test(attr.nodeName)) {
        var key = attr.nodeName.match(dataRegex)[1];
        dataAttrs[key] = attr.nodeValue;
      }
    }

    return dataAttrs;
  }

  // Get configuration settings from either `self` (the `Bugsnag` object)
  // or `data` (the `data-*` attributes).
  var data;
  function getSetting(name, fallback) {
    data = data || getData(thisScript);
    var setting = self[name] !== undefined ? self[name] : data[name.toLowerCase()];
    if (setting === "false") {
      setting = false;
    }
    return setting !== undefined ? setting : fallback;
  }

  // Validate a Bugsnag API key exists and is of the correct format.
  function validateApiKey(apiKey) {
    if (apiKey == null || !apiKey.match(API_KEY_REGEX)) {
      log("Invalid API key '" + apiKey + "'");
      return false;
    }

    return true;
  }

  // Send an error to Bugsnag.
  function sendToBugsnag(details, metaData) {
    // Validate the configured API key.
    var apiKey = getSetting("apiKey");
    if (!validateApiKey(apiKey)) {
      return;
    }

    // Check if we should notify for this release stage.
    var releaseStage = getSetting("releaseStage");
    var notifyReleaseStages = getSetting("notifyReleaseStages");
    if (notifyReleaseStages) {
      var shouldNotify = false;
      for (var i = 0; i < notifyReleaseStages.length; i++) {
        if (releaseStage === notifyReleaseStages[i]) {
          shouldNotify = true;
          break;
        }
      }

      if (!shouldNotify) {
        return;
      }
    }

    if (lastEvent) {
      metaData = metaData || {};
      metaData["Last Event"] = eventToMetaData(lastEvent);
    }

    // Merge the local and global `metaData`.
    var mergedMetaData = merge(getSetting("metaData"), metaData);

    // Run any `beforeNotify` function
    var beforeNotify = self.beforeNotify;
    if (typeof(beforeNotify) === "function") {
      var retVal = beforeNotify(details, mergedMetaData);
      if (retVal === false) {
        return;
      }
    }

    // Make the request:
    //
    // -  Work out which endpoint to send to.
    // -  Combine error information with other data such as
    //    user-agent and locale, `metaData` and settings.
    // -  Make the HTTP request.
    var location = window.location;
    request(getSetting("endpoint") || DEFAULT_NOTIFIER_ENDPOINT, {
      notifierVersion: NOTIFIER_VERSION,

      apiKey: apiKey,
      projectRoot: getSetting("projectRoot") || location.protocol + "//" + location.host,
      context: getSetting("context") || location.pathname,
      userId: getSetting("userId"),
      metaData: mergedMetaData,
      releaseStage: releaseStage,

      url: window.location.href,
      userAgent: navigator.userAgent,
      language: navigator.language || navigator.userLanguage,

      name: details.name,
      message: details.message,
      stacktrace: details.stacktrace,
      file: details.file,
      lineNumber: details.lineNumber,
      columnNumber: details.columnNumber
    });
  }

  // Generate a browser stacktrace (or approximation) from the current stack.
  // This is used to add a stacktrace to `Bugsnag.notify` calls, and to add a
  // stacktrace approximation where we can't get one from an exception.
  function generateStacktrace() {
    var stacktrace;
    var MAX_FAKE_STACK_SIZE = 10;
    var ANONYMOUS_FUNCTION_PLACEHOLDER = "[anonymous]";

    // Try to generate a real stacktrace (most browsers, except IE9 and below).
    try {
      throw new Error("");
    } catch (exception) {
      stacktrace = stacktraceFromException(exception);
    }

    // Otherwise, build a fake stacktrace from the list of method names by
    // looping through the list of functions that called this one (and skip
    // whoever called us).
    if (!stacktrace) {
      var functionStack = [];
      try {
        var curr = arguments.callee.caller.caller;
        while (curr && functionStack.length < MAX_FAKE_STACK_SIZE) {
          var fn = FUNCTION_REGEX.test(curr.toString()) ? RegExp.$1 || ANONYMOUS_FUNCTION_PLACEHOLDER : ANONYMOUS_FUNCTION_PLACEHOLDER;
          functionStack.push(fn);
          curr = curr.caller;
        }
      } catch (e) {
        log(e);

      }

      stacktrace = functionStack.join("\n");
    }

    // Tell the backend to ignore the first two lines in the stack-trace.
    // generateStacktrace() + window.onerror,
    // generateStacktrace() + notify,
    // generateStacktrace() + notifyException
    return "<generated>\n" + stacktrace;
  }

  // Get the stacktrace string from an exception
  function stacktraceFromException(exception) {
    return exception.stack || exception.backtrace || exception.stacktrace;
  }

  // Populate the event tab of meta-data.
  function eventToMetaData(event) {
    var tab = {
      millisecondsAgo: new Date() - event.timeStamp,
      type: event.type,
      which: event.which,
      target: targetToString(event.target)
    };

    return tab;
  }

  // Convert a DOM element into a string suitable for passing to Bugsnag.
  function targetToString(target) {
    if (target) {
      var attrs = target.attributes;

      if (attrs) {
        var ret = "<" + target.nodeName.toLowerCase();
        for (var i = 0; i < attrs.length; i++) {
          if (attrs[i].value && attrs[i].value.toString() != "null") {
            ret += " " + attrs[i].name + "=\"" + attrs[i].value + "\"";
          }
        }
        return ret + ">";
      } else {
         // e.g. #document
        return target.nodeName;
      }
    }
  }

  // If we've notified bugsnag of an exception in wrap, we don't want to
  // re-notify when it hits window.onerror after we re-throw it.
  function ignoreNextOnError() {
    ignoreOnError += 1;
    window.setTimeout(function () {
      ignoreOnError -= 1;
    });
  }

  // Disable catching on IE < 10 as it destroys stack-traces from generateStackTrace()
  if (!window.atob) {
    shouldCatch = false;

  // Disable catching on browsers that support HTML5 ErrorEvents properly.
  // This lets debug on unhandled exceptions work.
  } else if (window.ErrorEvent) {
    try {
      if (new window.ErrorEvent("test").colno === 0) {
        shouldCatch = false;
      }
    } catch(e){ }
  }


  //
  // ### Polyfilling
  //

  // Add a polyFill to an object
  function polyFill(obj, name, makeReplacement) {
    var original = obj[name];
    var replacement = makeReplacement(original);
    obj[name] = replacement;

    if (typeof BUGSNAG_TESTING !== "undefined" && window.undo) {
      window.undo.push(function () {
        obj[name] = original;
      });
    }
  }

  if (getSetting("autoNotify", true)) {
    //
    // ### Automatic error notification
    //
    // Attach to `window.onerror` events and notify Bugsnag when they happen.
    // These are mostly js compile/parse errors, but on some browsers all
    // "uncaught" exceptions will fire this event.
    //
    polyFill(window, "onerror", function (_super) {
      // Keep a reference to any existing `window.onerror` handler
      if (typeof BUGSNAG_TESTING !== "undefined") {
        self._onerror = _super;
      }

      return function bugsnag(message, url, lineNo, charNo, exception) {
        var shouldNotify = getSetting("autoNotify", true);
        var metaData = {};

        // IE 6+ support.
        if (!charNo && window.event) {
          charNo = window.event.errorCharacter;
        }

        addScriptToMetaData(metaData);
        lastScript = null;

        if (shouldNotify && !ignoreOnError) {

          sendToBugsnag({
            name: exception && exception.name || "window.onerror",
            message: message,
            file: url,
            lineNumber: lineNo,
            columnNumber: charNo,
            stacktrace: (exception && stacktraceFromException(exception)) || generateStacktrace()
          }, metaData);
        }

        if (typeof BUGSNAG_TESTING !== "undefined") {
          _super = self._onerror;
        }

        // Fire the existing `window.onerror` handler, if one exists
        if (_super) {
          _super(message, url, lineNo, charNo, exception);
        }
      };
    });

    var hijackTimeFunc = function (_super) {
      // Note, we don't do `_super.call` because that doesn't work on IE 8,
      // luckily this is implicitly window so it just works everywhere.
      //
      // setTimout in all browsers except IE <9 allows additional parameters
      // to be passed, so in order to support these without resorting to call/apply
      // we need an extra layer of wrapping.
      return function (f, t) {
        f = wrap(f);
        var args = Array.prototype.slice.call(arguments, 2);
        return _super(function () {
          f.apply(this, args);
        }, t);
      };
    };

    polyFill(window, "setTimeout", hijackTimeFunc);
    polyFill(window, "setInterval", hijackTimeFunc);
    if (window.requestAnimationFrame) {
      polyFill(window, "requestAnimationFrame", hijackTimeFunc);
    }

    var hijackEventFunc = function (_super) {
      return function (e, f, capture, secure) {
        // HTML lets event-handlers be objects with a handlEvent function,
        // we need to change f.handleEvent here, as self.wrap will ignore f.
        if (f && f.handleEvent) {
          f.handleEvent = wrap(f.handleEvent, {eventHandler: true});
        }
        return _super.call(this, e, wrap(f, {eventHandler: true}), capture, secure);
      };
    };

    // EventTarget is all that's required in modern chrome/opera
    // EventTarget + Window + ModalWindow is all that's required in modern FF (there are a few Moz prefixed ones that we're ignoring)
    // The rest is a collection of stuff for Safari and IE 11. (Again ignoring a few MS and WebKit prefixed things)
    "EventTarget Window Node ApplicationCache AudioTrackList ChannelMergerNode CryptoOperation EventSource FileReader HTMLUnknownElement IDBDatabase IDBRequest IDBTransaction KeyOperation MediaController MessagePort ModalWindow Notification SVGElementInstance Screen TextTrack TextTrackCue TextTrackList WebSocket WebSocketWorker Worker XMLHttpRequest XMLHttpRequestEventTarget XMLHttpRequestUpload".replace(/\w+/g, function (global) {
      var prototype = window[global] && window[global].prototype;
      if (prototype && prototype.hasOwnProperty && prototype.hasOwnProperty("addEventListener")) {
        polyFill(prototype, "addEventListener", hijackEventFunc);
        // We also need to hack removeEventListener so that you can remove any
        // event listeners.
        polyFill(prototype, "removeEventListener", hijackEventFunc);
      }
    });
  }

  return self;
});
