define('main', ["../../src/bugsnag"], function (bugsnag) {
    bugsnag.apiKey = "9e68f5104323042c09d8809674e8d05c";
    bugsnag.testRequest = function (url, params) {
        window.parent.testResult(params);
    };

    setTimeout(function () {
      throw new Error('requirejs error');
    });
});
