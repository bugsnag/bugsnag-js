window.Bugsnag = (function (window, document) {
  "use strict";
  var self = {};

  // Constants
  var API_KEY_REGEX = /^[0-9a-f]{32}$/i;
  var DEFAULT_ENDPOINT = "https://notify.bugsnag.com/js";
  var NOTIFIER_VERSION = "<%= pkg.version %>";

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

  // Encode strings for use in a querystring
  function encodeForQueryString(str) {
    return encodeURIComponent(str).replace(/%20/g, "+");
  }

  // Serialize an object into a querystring
  function serialize(obj, prefix) {
    var str = [];
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
    var req = new Image();
    req.src = url + "?" + serialize(payload) + "&ct=img";
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

    try {
      throw new Error("stackgen");
    } catch (exception) {
      return exception.stack || exception.backtrace || exception.stacktrace;
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
      name: "Fatal Error",
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
      stacktrace: generateStacktrace(),
      discardTopFrame: true
    }, metaData);
  };

  // Notify Bugsnag of an exception
  self.notifyException = function (exception, metaData) {
    sendToBugsnag({
      name: exception.name,
      message: exception.message || exception.description,
      stacktrace: exception.stack || exception.backtrace || exception.stacktrace,
      file: exception.fileName || exception.sourceURL,
      lineNumber: exception.lineNumber || exception.line
    }, metaData);
  };

  return self;
}(window, document));