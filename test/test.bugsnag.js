after(function () {
  var passes, fails;

  var ems = document.getElementsByTagName('em');
  for (var i = 0; i < ems.length; i++) {
    if (ems[i].parentNode.className == 'passes') {
      passes = parseInt(ems[i].innerHTML);
    } else if (ems[i].parentNode.className == 'failures') {
      fails = parseInt(ems[i].innerHTML, 10);
    }
  }
  document.title =  passes + '/' + (passes + fails);
});
describe("Bugsnag", function () {
  beforeEach(buildUp);
  afterEach(tearDown);

  describe("notifyException", function () {
    it("should not notify if apiKey is not set", function () {
      Bugsnag.apiKey = null;
      Bugsnag.notifyException(new Error("Example error"));

      assert(!Bugsnag.testRequest.called, "Bugsnag.testRequest should not have been called");
    });

    it("should not notify if apiKey is invalid", function () {
      Bugsnag.apiKey = "bad-api-key";
      Bugsnag.notifyException(new Error("Example error"));

      assert(!Bugsnag.testRequest.called, "Bugsnag.testRequest should not have been called");
    });

    it("should contain an apiKey", function () {
      Bugsnag.notifyException(new Error("Example error"));

      assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
      assert(requestData().params.apiKey, "apiKey should be in request params");
    });

    it("should contain exception class name", function () {
      Bugsnag.notifyException(new URIError("Example error"));

      assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
      assert.equal(requestData().params.name, "URIError");
    });

    it("should contain the custom class name if overridden", function () {
      Bugsnag.notifyException(new URIError("Example error"), "CustomError");

      assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
      assert.equal(requestData().params.name, "CustomError");
    });

    it("should contain the correct exception message", function () {
      Bugsnag.notifyException(new Error("Example error"));

      assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
      assert.equal(requestData().params.message, "Example error");
    });

    it("should contain a stacktrace", function () {
      try {
        throw new Error("Example error");
      } catch (e) {
        Bugsnag.notifyException(e);
      }

      assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
      assert(requestData().params.stacktrace != null, "stacktrace should be in request params");
    });

    it("should not notify if releaseStage isn't in notifyReleaseStages", function () {
      Bugsnag.notifyReleaseStages = ["production"];
      Bugsnag.releaseStage = "development";
      Bugsnag.notifyException(new Error("Example error"));

      assert(!Bugsnag.testRequest.called, "Bugsnag.testRequest should not have been called");
    });

    it("should notify if a custom releaseStage is in notifyReleaseStages", function () {
      Bugsnag.notifyReleaseStages = ["production", "custom"];
      Bugsnag.releaseStage = "custom";
      Bugsnag.notifyException(new Error("Example error"));

      assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
    });

    it("should contain global metaData if set", function () {
      var metaData = {some: {data: "here"}};

      Bugsnag.metaData = metaData;
      Bugsnag.notifyException(new Error("Example error"));

      assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
      assert.deepEqual(requestData().params.metaData, metaData, "metaData should match");
    });

    it("should contain local metaData if set", function () {
      var metaData = {some: {data: "here"}};

      Bugsnag.notifyException(new Error("Example error"), metaData);

      assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
      assert.deepEqual(requestData().params.metaData, metaData, "metaData should match");
    });

    it("should accept local metaData as a third parameter", function () {
      var metaData = {some: {data: "here"}};

      Bugsnag.notifyException(new Error("Example error"), "CustomError", metaData);

      assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
      assert.deepEqual(requestData().params.metaData, metaData, "metaData should match");
    });

    it("should contain merged metaData if both local and global metaData are set", function () {
      var globalMetaData = {some: {data: "here"}};
      var localMetaData = {some: {extra: {data: "here"}}};

      Bugsnag.metaData = globalMetaData;
      Bugsnag.notifyException(new Error("Example error"), localMetaData);

      assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
      assert.deepEqual(requestData().params.metaData, {
        some: {
          data: "here",
          extra: { data: "here" }
        }
      }, "metaData should match");
    });

    it("should use the https://notify.bugsnag.com/js endpoint by default", function () {
      Bugsnag.notifyException(new Error("Example error"));

      assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
      assert.equal(requestData().url, "https://notify.bugsnag.com/js");
    });

    it("should call a before notify callback", function() {
      stub(Bugsnag, "beforeNotify").returns(true);

      Bugsnag.notifyException(new Error("Example error"));

      assert(Bugsnag.beforeNotify.calledOnce, "Bugsnag.beforeNotify should have been called once");
      assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
    })

    it("should let before bugsnag notify halt notification", function() {
      stub(Bugsnag, "beforeNotify").returns(false);

      Bugsnag.notifyException(new Error("Example error"));

      assert(Bugsnag.beforeNotify.calledOnce, "Bugsnag.beforeNotify should have been called once");
      assert(!Bugsnag.testRequest.called, "Bugsnag.testRequest should not have been called");
    })
  });

  describe("notify", function () {
    it("should contain the correct error name", function () {
      Bugsnag.notify("CustomError", "Something broke");

      assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
      assert.equal(requestData().params.name, "CustomError");
    });

    it("should contain the correct error message", function () {
      Bugsnag.notify("CustomError", "Something broke");

      assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
      assert.equal(requestData().params.message, "Something broke");
    });

    it("should contain an auto-generated stacktrace", function () {
      Bugsnag.notify("CustomError", "Something broke");

      assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
      assert(requestData().params.stacktrace != null, "stacktrace should be present");
    });
  });
});

describe("window", function () {
  beforeEach(buildUp);
  afterEach(tearDown);

  it("should contain a Bugsnag object", function () {
    assert("Bugsnag" in window, "should have Bugsnag object on window");
  });

  describe("setTimeout", function () {
    it("should allow multiple parameters to be passed", function (done) {
      window.setTimeout(function (a, b) {
        assert.equal(2, a);
        done();
      }, 1, 2, 3);
    });
  });

  describe("onerror", function() {
    it("should notify bugsnag", function () {
      Bugsnag._onerror = null; // Disable mocha's onerror for this test

      window.onerror("Something broke", "http://example.com/example.js", 123);

      var params = requestData().params;
      assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
      assert.equal(params.name, "window.onerror");
      assert.equal(params.message, "Something broke");
      assert.equal(params.lineNumber, 123);
    });

    it("should be able to process column number and stacktrace in some browsers", function () {
      Bugsnag._onerror = null; // Disable mocha's onerror for this test

      window.onerror("Something broke", "http://example.com/example.js", 123, 15, new Error("Example error"));

      var params = requestData().params;
      assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
      assert("Error|window.onerror".indexOf(params.name) >= 0);
      assert.equal(params.message, "Something broke");
      assert.equal(params.lineNumber, 123);
      assert.equal(params.columnNumber, 15);
      assert.notEqual(params.stacktrace, undefined);
      assert(params.stacktrace.length > 0);
    });

    it("should not notify bugsnag if autoNotify is false", function () {
      Bugsnag.autoNotify = false;

      stub(Bugsnag, "_onerror");

      window.onerror("Something broke", "http://example.com/example.js", 123);

      assert(Bugsnag.testRequest.called === false, "Bugsnag.testRequest should not have been called");
      assert(Bugsnag._onerror.calledOnce, "Bugsnag._onerror should have been called once");
    });

    it("should call the original onerror", function () {
      stub(Bugsnag, "_onerror");

      window.onerror("Something broke", "http://example.com/example.js", 123);

      assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
      assert(Bugsnag._onerror.calledOnce, "Bugsnag._onerror should have been called once");
    });
  });

  if (window.addEventListener) {
    describe("sendMessage", function () {
      var callback, handle;
      function makeHandle() {
        return function handle(e) {
          setTimeout(function () {
            Bugsnag._onerror.restore();
            callback();
          });
          function failA() {
            throw new Error(e.data);
          }
          function failB() {
            failA();
          }
          failB(e);
        };
      }

      beforeEach(function () {
        stub(Bugsnag, '_onerror'); // disable reporting error to mocha.
        handle = makeHandle();
        window.addEventListener("message", handle, false);
      });

      afterEach(function () {
        window.removeEventListener("message", handle, false);
      });

      it("should automatically call the error handler once", function (done) {
        callback = function () {
          assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
          done();
        };
        window.postMessage("hello", "*");
      });

      if (navigator.appVersion.indexOf("MSIE 9") == -1 && navigator.appVersion.indexOf("Safari/5") == -1) {
        it("should include multi-line backtraces", function (done) {
          callback = function () {
            assert(Bugsnag.testRequest.calledOnce);
            assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
            assert(/failA(.|\n)*failB(.|\n)*handle/.test(requestData().params.stacktrace), "Bugsnag.testRequest should have been called with a multi-line stacktrace:: " + JSON.stringify(requestData().params.stacktrace));
            done();
          };
          window.postMessage("hello", "*");
        });
      } else {
        it("should pass once", function () { });
      }
    });
  } else {
    // TODO make better tests here for IE6/7/8
    it("should pass once", function () { });
    it("should pass twice", function () { });
  }
});


if (window.addEventListener && document.body.click) {
  describe("document.body", function () {
    beforeEach(buildUp);
    afterEach(tearDown);

    describe("addEventListener", function () {
      var callback, handle;
      function makeHandle() {
        return function handle(e) {
          setTimeout(function () {
            Bugsnag._onerror.restore();
            callback();
          });
          function failA() {
            throw new Error("clicked");
          }
          function failB() {
            failA();
          }
          failB(e);
        };
      }

      beforeEach(function () {
        handle = makeHandle();
        stub(Bugsnag, '_onerror'); // disable reporting error to mocha.
        document.body.addEventListener("click", handle, false);
      });

      afterEach(function () {
        document.body.removeEventListener("click", handle, false);
      });

      it("should automatically call the error handler once", function (done) {
        callback = function () {
          assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
          done();
        };
        document.body.click();
      });

      if (navigator.appVersion.indexOf("MSIE 9") == -1) {
        it("should include multi-line backtraces", function mooCow(done) {
          callback = function () {
            assert(Bugsnag.testRequest.calledOnce, "Bugsnag.testRequest should have been called once");
            assert(/failA(.|\n)*failB(.|\n)*handle/.test(requestData().params.stacktrace), "Bugsnag.testRequest should have been called with a multi-line stacktrace:: " + JSON.stringify(requestData().params.stacktrace));
            done();
          };
          document.body.click();
        });
      } else {
        it("should pass once", function () {});
      }
    });
  });
} else {
  // TODO make better tests here for IE6/7/8
  it("should pass once", function () { });
  it("should pass twice", function () { });
}

describe("inline script", function () {
  it("should include the content", function (done) {
    var iframe = document.createElement('iframe');
    iframe.src = 'inlinescript.html';
    window.testResult = function (params) {
      document.body.removeChild(iframe);
      try {
        assert.equal(params.metaData.script.content.replace(/\r\n/, ""), "\n    (function () {\n      atob();\n    })();\n  ");
        done();
      } catch(e) {
        console.log(JSON.stringify(params.metaData.script.content));
        done(e);
      }
    };
    document.body.appendChild(iframe);
  });
});

describe("current script", function () {
  beforeEach(buildUp);
  afterEach(tearDown);

  it("should track currentScript across event handlers", function (done) {
    var iframe = document.createElement('iframe');
    iframe.src = 'inlinescript1.html';
    window.testResult = function (params) {
      document.body.removeChild(iframe);
      try {
        assert.equal(params.metaData.script.content.replace(/\r\n/, ""),"\n    (function () {\n     setTimeout(function () {\n       atob();\n      });\n    })();\n  ");
        done();
      } catch(e) {
        console.log(JSON.stringify(params.metaData));
        done(e);
      }
    };
    document.body.appendChild(iframe);
  });
});

describe("noConflict", function() {
  beforeEach(buildUp);
  afterEach(tearDown);

  it("should restore previous window.Bugsnag binding", function () {
    var newBugsnag = window.Bugsnag.noConflict();
    assert("put_me_back" in window.Bugsnag, "should have restored dummy object");
  });

  it("should remove bugsnag object from window.Bugsnag", function() {
    var newBugsnag = window.Bugsnag.noConflict();
    assert(!("notifyException" in window.Bugsnag), "should not have Bugsnag functions");
  });

  it("should return full bugsnag object", function () {
    var newBugsnag = window.Bugsnag.noConflict();
    assert("notifyException" in newBugsnag, "noConflict object should have bugsnag functions");
  });
});

function buildUp(cb) {
  // dummy object to override
  window.Bugsnag = {put_me_back: 1};

  window.BUGSNAG_TESTING = true;
  window.undo = [];

  // Create bugsnag.js script tag
  var bugsnag = document.createElement("script");
  bugsnag.id = "bugsnag";
  bugsnag.type = "text/javascript";
  bugsnag.src = "../src/bugsnag.js";
  bugsnag.onload = bugsnag.onreadystatechange = function () {
    if(!this.readyState || this.readyState === "loaded" || this.readyState === "complete") {
      // Set api key to use when testing
      Bugsnag.apiKey = "9e68f5104323042c09d8809674e8d05c";

      // Stub out requests
      stub(Bugsnag, "testRequest");

      // Setup is done
      cb();
    }
  };

  // Add bugsnag.js script tag to dom
  document.getElementsByTagName("body")[0].appendChild(bugsnag);
}

function tearDown() {
  // Remove the bugsnag.js script tag
  var bugsnag = document.getElementById("bugsnag");
  bugsnag.parentNode.removeChild(bugsnag);

  // Remove the Bugsnag object
  if (window.Bugsnag && window.Bugsnag.noConflict) {
    Bugsnag.noConflict();
  }

  for (var i = 0; i < window.undo.length; i++) {
    undo[i]();
  }
}

function requestData() {
  return {
    url: Bugsnag.testRequest.args[0][0],
    params: Bugsnag.testRequest.args[0][1]
  };
}
