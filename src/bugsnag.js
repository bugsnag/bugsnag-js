/*
  Bugsnag JavaScript Notifier
*/

window.Bugsnag = (function () {
  var self = {};

  // Constants
  var API_KEY_REGEX = /^[0-9a-f]{32}$/i;
  var DEFAULT_ENDPOINT = "https://notify.bugsnag.com/js";
  var NOTIFIER_VERSION = "1.0.0";

  // Keep a reference to the running script
  var scripts = document.getElementsByTagName("script");
  var thisScript = scripts[scripts.length - 1];

  // Safe console.log wrapper
  function log(msg) {
    var console = window.console;
    if (console !== undefined && console.log !== undefined) {
      console.log("[Bugsnag] " + msg);
    }
  }

  // Make a GET request with this url and payload
  function request(url, payload) {
    // Build escaped querystring params
    var params = [];
    for (var key in payload) {
      if (payload.hasOwnProperty(key)) {
        var value = payload[key];
        if (key != null && value != null) {
          params.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
        }
      }
    }

    // Create jsonp script tag
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = url + "?" + params.join("&");
    document.getElementsByTagName("head")[0].appendChild(script);
  }

  // Merge source object into target
  function merge(target, source) {
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
  var data = getData(thisScript);
  function getSetting(name) {
    return self[name] || data[name.toLowerCase()];
  }

  // Set up auto-notification
  var oldOnError = window.onerror;
  window.onerror = function (message, url, lineNo) {
    // TODO: Send to bugsnag

    // Fire any previous onerror function
    if (oldOnError) {
      oldOnError(message, url, lineNo);
    }
  };

  // Notify Bugsnag of an exception
  self.notify = function (e, metaData) {
    // Validate the API key
    var apiKey = getSetting("apiKey");
    if (apiKey == null || !apiKey.match(API_KEY_REGEX)) {
      log("Invalid API key '" + apiKey + "'");
      return;
    }

    // Fetch and merge metaData objects
    var mergedMetaData = getSetting("metaData") || {};
    merge(mergedMetaData, metaData);

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

      // Extract data from exceptions
      name: e.name,
      message: e.message,
      stacktrace: e.stack || e.backtrace,
      type: e.type,
      source: e.source,
      file: e.fileName || e.sourceURL,
      lineNumber: e.lineNumber || e.line
    });
  };

  return self;
}());