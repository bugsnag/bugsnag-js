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

(function(definition) {
  var old = window.Bugsnag;
  window.Bugsnag = definition(window, old);
})(function (window, old) {
  var self = {},
      shouldCatch = true;

  var FUNCTION_REGEX = /function\s*([\w\-$]+)?\s*\(/i;

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

  self.noConflict = function() {
    window.Bugsnag = old;
    return self;
  };

  // Get the stacktrace string from an exception
  self.stacktraceFromException = function (exception) {
    return exception.stack || exception.backtrace || exception.stacktrace;
  };

  self.checkFuncOnErrors = function (_super, args) {
  //   // We set shouldCatch to false on IE < 10 because catching the error ruins the file/line as reported in window.onerror,
  //   // We set shouldCatch to false on Chrome/Safari because it interferes with "break on unhandled exception"
  //   // All other browsers need shouldCatch to be true, as they don't pass the exception object to window.onerror
    if (shouldCatch) {
      try {
        return _super.apply(this, args);
      } catch (e) {
        return e;
      }
    } else {
      return _super.apply(this, args);
    }
  };

  // Generate a browser stacktrace (or approximation) from the current stack.
  // This is used to add a stacktrace to `Bugsnag.notify` calls, and to add a
  // stacktrace approximation where we can't get one from an exception.
  self.generateStacktrace = function () {
    var stacktrace;
    var MAX_FAKE_STACK_SIZE = 10;
    var ANONYMOUS_FUNCTION_PLACEHOLDER = "[anonymous]";

    // Try to generate a real stacktrace (most browsers, except IE9 and below).
    try {
      throw new Error("");
    } catch (exception) {
      stacktrace = self.stacktraceFromException(exception);
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
      } catch (e) {}

      stacktrace = functionStack.join("\n");
    }

    // Tell the backend to ignore the first two lines in the stack-trace.
    // generateStacktrace() + window.onerror,
    // generateStacktrace() + notify,
    // generateStacktrace() + notifyException
    return "<generated>\n" + stacktrace;
  };

  //
  // ### Hijacking
  //
  // hijack an object method
  var hijack = function (obj, name, makeReplacement) {
    var original = obj[name];
    var replacement = makeReplacement(original);
    obj[name] = replacement;
  };


  var hijackTimeFunc = function (_super) {
    // Note, we don't do `_super.call` because that doesn't work on IE 8,
    // luckily this is implicitly window so it just works everywhere.
    //
    // setTimout in all browsers except IE <9 allows additional parameters
    // to be passed, so in order to support these without resorting to call/apply
    // we need an extra layer of wrapping.
    return function (f, t) {
      if (typeof f === "function") {
        f = wrap(f);
        var args = Array.prototype.slice.call(arguments, 2);
        return _super(function () {
          f.apply(this, args);
        }, t);
      } else {
        return _super(f, t);
      }
    };
  };

  // This is not a public function because it can only be used if
  // the exception is not caught after being thrown out of this function.
  //
  // If you call wrap twice on the same function, it'll give you back the
  // same wrapped function. This lets removeEventListener to continue to
  // work.

  var wrap = function (_super, options) {
    try {
      if (typeof _super !== "function") {
        return _super;
      }
      if (!_super.bugsnag) {
        _super.bugsnag = self.hijackFunction(_super, options);
        _super.bugsnag.bugsnag = _super.bugsnag;
      }
      return _super.bugsnag;

    // This can happen if _super is not a normal javascript function.
    // For example, see https://github.com/bugsnag/bugsnag-js/issues/28
    } catch (e) {
      return _super;
    }
  };

  self.hijackAll = function (hijackOnerrorFunc, hijackFunction, maybeOverrideHijack) {
    if (!hijackOnerrorFunc || !hijackFunction) {
      throw new Error("hijackOnerrorFunc and hijackFunction must be defined");
    }
    hijack = maybeOverrideHijack || hijack;

    self.hijackFunction = hijackFunction;

    hijack(window, "onerror", hijackOnerrorFunc);
    hijack(window, "setTimeout", hijackTimeFunc);
    hijack(window, "setInterval", hijackTimeFunc);
    if (window.requestAnimationFrame) {
      hijack(window, "requestAnimationFrame", hijackTimeFunc);
    }
    if (window.setImmediate) {
      hijack(window, "setImmediate", function (_super) {
        return function (f) {
          var args = Array.prototype.slice.call(arguments);
          args[0] = wrap(args[0]);
          return _super.apply(this, args);
        };
      });
    }

    // EventTarget is all that's required in modern chrome/opera
    // EventTarget + Window + ModalWindow is all that's required in modern FF (there are a few Moz prefixed ones that we're ignoring)
    // The rest is a collection of stuff for Safari and IE 11. (Again ignoring a few MS and WebKit prefixed things)
    "EventTarget Window Node ApplicationCache AudioTrackList ChannelMergerNode CryptoOperation EventSource FileReader HTMLUnknownElement IDBDatabase IDBRequest IDBTransaction KeyOperation MediaController MessagePort ModalWindow Notification SVGElementInstance Screen TextTrack TextTrackCue TextTrackList WebSocket WebSocketWorker Worker XMLHttpRequest XMLHttpRequestEventTarget XMLHttpRequestUpload".replace(/\w+/g, function (global) {
      var prototype = window[global] && window[global].prototype;
      if (prototype && prototype.hasOwnProperty && prototype.hasOwnProperty("addEventListener")) {
        hijack(prototype, "addEventListener", function (_super) {
          return function (e, f, capture, secure) {
            var options = {eventHandler: true};
            // HTML lets event-handlers be objects with a handlEvent function,
            // we need to change f.handleEvent here, as self.wrap will ignore f.
            if (f && f.handleEvent) {
              f.handleEvent = wrap(f.handleEvent, options);
            }
            return _super.call(this, e, wrap(f, options), capture, secure);
          };
        });

        // We also need to hack removeEventListener so that you can remove any
        // event listeners.
        hijack(prototype, "removeEventListener", function (_super) {
          return function (e, f, capture, secure) {
            _super.call(this, e, f, capture, secure);
            return _super.call(this, e, wrap(f), capture, secure);
          };
        });
      }
    });
  };

  return self;
});