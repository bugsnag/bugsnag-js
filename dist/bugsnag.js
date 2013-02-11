window.Bugsnag = (function (window, document, navigator) {
  var self = {};

  // Constants
  var API_KEY_REGEX = /^[0-9a-f]{32}$/i;
  var FUNCTION_REGEX = /function\s*([\w\-$]+)?\s*\(/i;
  var MAX_FAKE_STACK_SIZE = 10;
  var ANONYMOUS_FUNCTION_PLACEHOLDER = "[anonymous]";
  var DEFAULT_ENDPOINT = "https://notify.bugsnag.com/js";
  var NOTIFIER_VERSION = "1.0.2";

  // Keep a reference to the running script
  var scripts = document.getElementsByTagName("script");
  var thisScript = scripts[scripts.length - 1];
  var data;

  // Safe console.log wrapper
  function log(msg) {
    var console = window.console;
    if (console !== undefined && console.log !== undefined) {
      console.log("[Bugsnag] " + msg);
    }
  }

  // Serialize an object into a querystring
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

  // Make a GET request with this url and payload
  function request(url, payload) {
    if (self.testRequest) {
      self.testRequest(url, payload);
    } else {
      var img = new Image();
      img.src = url + "?" + serialize(payload) + "&ct=img&cb=" + new Date().getTime();
    }
  }

  // Merge source object into target
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

  // Get all the data- attributes from the script tag
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

  // Get a setting from self or data
  function getSetting(name) {
    data = data || getData(thisScript);
    return self[name] || data[name.toLowerCase()];
  }

  // Send error details to Bugsnag
  function sendToBugsnag(details, metaData) {
    // Validate the API key
    var apiKey = getSetting("apiKey");
    if (apiKey == null || !apiKey.match(API_KEY_REGEX)) {
      log("Invalid API key '" + apiKey + "'");
      return;
    }

    // Fetch and merge metaData objects
    var mergedMetaData = merge(getSetting("metaData"), metaData);

    // Make the request
    var endpoint = getSetting("endpoint") || DEFAULT_ENDPOINT;
    var location = window.location;
    request(endpoint, {
      // Notifier
      notifierVersion: NOTIFIER_VERSION,

      // Bugsnag settings
      apiKey: apiKey,
      projectRoot: getSetting("projectRoot") || location.protocol + "//" + location.host,
      context: getSetting("context") || location.pathname,
      metaData: mergedMetaData,
      releaseStage: getSetting("releaseStage"),

      // Useful data
      url: window.location.href,
      userAgent: navigator.userAgent,
      language: navigator.language || navigator.userLanguage,

      // Error details
      name: details.name,
      message: details.message,
      stacktrace: details.stacktrace,
      file: details.file,
      lineNumber: details.lineNumber
    });
  }

  // Generate a stacktrace
  function generateStacktrace() {
    var stacktrace;

    // Try to generate a real stacktrace (most browsers)
    try {
      throw new Error("stackgen");
    } catch (exception) {
      stacktrace = exception.stack || exception.backtrace || exception.stacktrace;
    }

    // Otherwise, build a fake stacktrace from the list of method names (IE9 and lower)
    if (!stacktrace) {
      // Loop through the list of functions that called this one (and skip whoever called us)
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



  //
  // Automatic error handlers
  //

  // window.onerror (mostly js compile/parse errors)
  self._onerror = window.onerror;
  window.onerror = function (message, url, lineNo) {
    sendToBugsnag({
      name: "window.onerror",
      message: message,
      file: url,
      lineNumber: lineNo
    });

    // Fire any previous onerror function
    if (self._onerror) {
      self._onerror(message, url, lineNo);
    }
  };



  //
  // Manual error notification
  //

  // Notify Bugsnag of a named error
  self.notify = function (name, message, metaData) {
    sendToBugsnag({
      name: name,
      message: message,
      stacktrace: generateStacktrace()
    }, metaData);
  };

  // Notify Bugsnag of an exception
  self.notifyException = function (exception, metaData) {
    sendToBugsnag({
      name: exception.name,
      message: exception.message || exception.description,
      stacktrace: exception.stack || exception.backtrace || exception.stacktrace || generateStacktrace(),
      file: exception.fileName || exception.sourceURL,
      lineNumber: exception.lineNumber || exception.line
    }, metaData);
  };

  return self;
}(window, document, navigator));