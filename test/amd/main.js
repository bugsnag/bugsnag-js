define('main', ["../../src/bugsnag"], function (bugsnag) {
    bugsnag.apiKey = "066f5ad3590596f9aa8d601ea89af845";
    bugsnag.testRequest = function (url, params) {
        window.parent.testResult(params);
    };

    setTimeout(function () {
      throw new Error('requirejs error');
    });
});
