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
window.Bugsnag = (function (window, document, navigator) {
  var self = {};

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
      metaData = name;
    }

    sendToBugsnag({
      name: name || exception.name,
      message: exception.message || exception.description,
      stacktrace: stacktraceFromException(exception) || generateStacktrace(),
      file: exception.fileName || exception.sourceURL,
      lineNumber: exception.lineNumber || exception.line
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


  //
  // ### Automatic error notification
  //

  // Keep a reference to any existing `window.onerror` handler
  self._onerror = window.onerror;

  // Attach to `window.onerror` events and notify Bugsnag when they happen.
  // These are mostly js compile/parse errors, but on some browsers all
  // "uncaught" exceptions will fire this event.
  window.onerror = function (message, url, lineNo) {
    sendToBugsnag({
      name: "window.onerror",
      message: message,
      file: url,
      lineNumber: lineNo
    });

    // Fire the existing `window.onerror` handler, if one exists
    if (self._onerror) {
      self._onerror(message, url, lineNo);
    }
  };


  //
  // ### Helpers & Setup
  //

  // Compile regular expressions upfront.
  var API_KEY_REGEX = /^[0-9a-f]{32}$/i;
  var FUNCTION_REGEX = /function\s*([\w\-$]+)?\s*\(/i;

  // Set up default notifier settings.
  var DEFAULT_BASE_ENDPOINT = "https://notify.bugsnag.com/";
  var DEFAULT_NOTIFIER_ENDPOINT = DEFAULT_BASE_ENDPOINT + "js";
  var DEFAULT_METRICS_ENDPOINT = DEFAULT_BASE_ENDPOINT + "metrics";
  var NOTIFIER_VERSION = "1.0.6-beta";
  var DEFAULT_RELEASE_STAGE = "production";
  var DEFAULT_NOTIFY_RELEASE_STAGES = [DEFAULT_RELEASE_STAGE];

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
    var encodeForQueryString = encodeURIComponent;
    for (var p in obj) {
      if (obj.hasOwnProperty(p) && p != null && obj[p] != null) {
        var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
        str.push(typeof v === "object" ? serialize(v, k) : encodeForQueryString(k) + "=" + encodeForQueryString(v));
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
    if (!self.testRequest) {
      var img = new Image();
      img.src = url + "?" + serialize(params) + "&ct=img&cb=" + new Date().getTime();
    } else {
      self.testRequest(url, params);
    }
  }

  // Extrat all `data-*` attributes from a DOM element and return them as an
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
  function getSetting(name) {
    data = data || getData(thisScript);
    return self[name] || data[name.toLowerCase()];
  }

  // Send error details to Bugsnag:
  function sendToBugsnag(details, metaData) {
    // Validate the configured API key.
    var apiKey = getSetting("apiKey");
    if (apiKey == null || !apiKey.match(API_KEY_REGEX)) {
      log("Invalid API key '" + apiKey + "'");
      return;
    }

    // Check if we should notify for this release stage.
    var releaseStage = getSetting("releaseStage") || DEFAULT_RELEASE_STAGE;
    var notifyReleaseStages = getSetting("notifyReleaseStages") || DEFAULT_NOTIFY_RELEASE_STAGES;
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

    // Merge the local and global `metaData`.
    var mergedMetaData = merge(getSetting("metaData"), metaData);

    // Work out which endpoint to send to.
    var endpoint = getSetting("endpoint") || DEFAULT_NOTIFIER_ENDPOINT;

    // Combine error information with other data such as
    // user-agent and locale, `metaData` and settings.
    var location = window.location;
    var payload = {
      notifierVersion: NOTIFIER_VERSION,

      apiKey: apiKey,
      projectRoot: getSetting("projectRoot") || location.protocol + "//" + location.host,
      context: getSetting("context") || location.pathname,
      metaData: mergedMetaData,
      releaseStage: releaseStage,

      url: window.location.href,
      userAgent: navigator.userAgent,
      language: navigator.language || navigator.userLanguage,

      name: details.name,
      message: details.message,
      stacktrace: details.stacktrace,
      file: details.file,
      lineNumber: details.lineNumber
    };

    // Make the HTTP request.
    request(endpoint, payload);
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
      var curr = arguments.callee.caller.caller;
      while (curr && functionStack.length < MAX_FAKE_STACK_SIZE) {
        var fn = FUNCTION_REGEX.test(curr.toString()) ? RegExp.$1 || ANONYMOUS_FUNCTION_PLACEHOLDER : ANONYMOUS_FUNCTION_PLACEHOLDER;
        functionStack.push(fn);
        curr = curr.caller;
      }

      stacktrace = functionStack.join("\n");
    }

    return stacktrace;
  }

  // Get the stacktrace string from an exception
  function stacktraceFromException(exception) {
    return exception.stack || exception.backtrace || exception.stacktrace;
  }

  // Track a page-view for MAU/DAU metrics.
  function trackMetrics() {
    var shouldTrack = getSetting("metrics");
    if (shouldTrack !== true && shouldTrack !== "true") {
      return;
    }

    var apiKey = getSetting("apiKey");
    var cookieName = "bugsnag_" + apiKey;

    // Fetch or generate a userId
    var userId = getCookie(cookieName);
    if (userId == null) {
      userId = generateUUID();
      setCookie(cookieName, userId);
    }

    // Make the HTTP request.
    request(getSetting("metricsEndpoint") || DEFAULT_METRICS_ENDPOINT, {
      userId: userId,
      apiKey: apiKey
    });
  }

  // Generate a 4-character random hex string.
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  // Generate a version-4 UUID.
  function generateUUID() {
    return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
  }

  // Set a cookie value.
  function setCookie(name, value) {
    var date = new Date();
    date.setTime(date.getTime() + 864e8);
    document.cookie = name + "=" + value + "; expires=" + date.toGMTString();
  }

  // Get a cookie value.
  function getCookie(name) {
    var cookie = document.cookie.match(name + "=([^$;]+)");
    return cookie ? window.unescape(cookie[1]) : null;
  }


  //
  // ### Metrics tracking (DAU/MAU)
  //
  trackMetrics();

  return self;

}(window, document, navigator));