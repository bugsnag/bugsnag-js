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
  var BugsnagCore = window.Bugsnag;
  if (!BugsnagCore) {
    throw new Error("bugsnag.core.js must be included before");
  }
  window.Bugsnag = definition(window, document, navigator, BugsnagCore);
})(function (window, document, navigator, BugsnagCore) {
  var self = BugsnagCore,
      lastEvent,
      lastScript,
      previousNotification,
      ignoreOnError = 0,

      // We've seen cases where individual clients can infinite loop sending us errors
      // (in some cases 10,000+ errors per page). This limit is at the point where
      // you've probably learned everything useful there is to debug the problem,
      // and we're happy to under-estimate the count to save the client (and Bugsnag's) resources.
      eventsRemaining = 10;

  //
  // ### Manual error notification (public methods)
  //

  // #### Bugsnag.notifyException
  //
  // Notify Bugsnag about a given `exception`, typically that you've caught
  // with a `try/catch` statement or that you've generated yourself.
  //
  // It's almost always better to let an exception bubble rather than catching
  // it, as that gives more consistent behaviour across browsers. Consider
  // re-throwing instead of calling .notifyException.
  //
  // Since most JavaScript exceptions use the `Error` class, we also allow
  // you to provide a custom error name when calling `notifyException`.
  //
  // The default value is "warning" and "error" and "info" are also supported by the
  // backend, all other values cause the notification to be dropped; and you
  // will not see it in your dashboard.
  self.notifyException = function (exception, name, metaData, severity) {
    if (name && typeof name !== "string") {
      metaData = name;
      name = undefined;
    }
    if (!metaData) {
      metaData = {};
    }
    addScriptToMetaData(metaData);

    sendToBugsnag({
      name: name || exception.name,
      message: exception.message || exception.description,
      stacktrace: self.stacktraceFromException(exception) || self.generateStacktrace(),
      file: exception.fileName || exception.sourceURL,
      lineNumber: exception.lineNumber || exception.line,
      columnNumber: exception.columnNumber ? exception.columnNumber + 1 : undefined,
      severity: severity || "warning"
    }, metaData);
  };

  // #### Bugsnag.notify
  //
  // Notify Bugsnag about an error by passing in a `name` and `message`,
  // without requiring an exception.
  self.notify = function (name, message, metaData, severity) {
    sendToBugsnag({
      name: name,
      message: message,
      stacktrace: self.generateStacktrace(),
      severity: severity || "warning"
    }, metaData);
  };

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
        content: getSetting("inlineScript", true) ? script.innerHTML : ""
      };
    }
  }

  //
  // ### Helpers & Setup
  //

  // Compile regular expressions upfront.
  var API_KEY_REGEX = /^[0-9a-f]{32}$/i;

  // Set up default notifier settings.
  var DEFAULT_BASE_ENDPOINT = "https://notify.bugsnag.com/";
  var DEFAULT_NOTIFIER_ENDPOINT = DEFAULT_BASE_ENDPOINT + "js";
  var NOTIFIER_VERSION = "2.3.5";

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
    if (!validateApiKey(apiKey) || !eventsRemaining) {
      return;
    }
    eventsRemaining -= 1;

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

    // Don't send multiple copies of the same error.
    // This fixes a problem when a client goes into an infinite loop,
    // and starts wasting all their bandwidth sending messages to bugsnag.
    var deduplicate = [details.name, details.message, details.stacktrace].join("|");
    if (deduplicate === previousNotification) {
      return;
    } else {
      previousNotification = deduplicate;
    }

    if (lastEvent) {
      metaData = metaData || {};
      metaData["Last Event"] = eventToMetaData(lastEvent);
    }

    // Merge the local and global `metaData`.
    var mergedMetaData = merge(merge({}, getSetting("metaData")), metaData);

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
      userId: getSetting("userId"), // Deprecated, remove in v3
      user: getSetting("user"),
      metaData: mergedMetaData,
      releaseStage: releaseStage,
      appVersion: getSetting("appVersion"),

      url: window.location.href,
      userAgent: navigator.userAgent,
      language: navigator.language || navigator.userLanguage,

      severity: details.severity,

      name: details.name,
      message: details.message,
      stacktrace: details.stacktrace,
      file: details.file,
      lineNumber: details.lineNumber,
      columnNumber: details.columnNumber,
      payloadVersion: "2"
    });
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


  if (getSetting("autoNotify", true)) {
    //
    // ### Automatic error notification
    //
    // Attach to `window.onerror` events and notify Bugsnag when they happen.
    // These are mostly js compile/parse errors, but on some browsers all
    // "uncaught" exceptions will fire this event.
    //

    //
    // ### Hijacking
    //
    // hijack an object method
    var hijack = function (obj, name, makeReplacement) {
      var original = obj[name];
      var replacement = makeReplacement(original);
      obj[name] = replacement;

      if (typeof BUGSNAG_TESTING !== "undefined" && window.undo) {
        window.undo.push(function () {
          obj[name] = original;
        });
      }
    };

    var hijackOnerrorFunc = function (_super) {
      // Keep a reference to any existing `window.onerror` handler
      if (typeof BUGSNAG_TESTING !== "undefined") {
        self._onerror = _super;
      }

      return function bugsnag(message, url, lineNo, charNo, exception) {
        // IE 6+ support.
        if (!charNo && window.event) {
          charNo = window.event.errorCharacter;
        }

        var shouldNotify = getSetting("autoNotify", true);
        var metaData = {};

        addScriptToMetaData(metaData);
        lastScript = null;

        if (shouldNotify && !ignoreOnError) {

          sendToBugsnag({
            name: exception && exception.name || "window.onerror",
            message: message,
            file: url,
            lineNumber: lineNo,
            columnNumber: charNo,
            stacktrace: (exception && self.stacktraceFromException(exception)) || self.generateStacktrace(),
            severity: "error"
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
    };

    // Return a function acts like the given function, but reports
    // any exceptions to Bugsnag before re-throwing them.
    //

    var hijackFunction = function (_super, options) {
      var currentScript = getCurrentScript();

      return function bugsnag(event) {
        if (options && options.eventHandler) {
          lastEvent = event;
        }
        lastScript = currentScript;

        var checkFuncOnErrorsResult = self.checkFuncOnErrors(_super, arguments);

        if (checkFuncOnErrorsResult instanceof Error) {
          if (getSetting("autoNotify", true)) {
            self.notifyException(checkFuncOnErrorsResult, null, null, "error");
            ignoreNextOnError();
          }
          lastScript = null;
          throw checkFuncOnErrorsResult;
        } else {
          lastScript = null;
          return checkFuncOnErrorsResult;
        }
      };
    };

    self.hijackAll(hijackOnerrorFunc, hijackFunction, hijack);
  }

  return self;
});
