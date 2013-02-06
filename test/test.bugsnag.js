describe("Bugsnag", function () {
  beforeEach(function (done) {
    buildUp(done);
  });

  afterEach(function () {
    tearDown();
  });

  it("should export a Bugsnag object on window", function () {
    expect(window).to.have.property("Bugsnag");
  });

  describe("notification", function () {
    it("should not notify if apiKey is not set", function () {
      Bugsnag.apiKey = null;
      Bugsnag.notifyException(new Error("Example error"));

      testRequest(function (request, url, params) {
        expect(request).to.not.have.been.called;
      });
    });
  
    it("should not notify if apiKey is invalid", function () {
      Bugsnag.apiKey = "bad-api-key";
      Bugsnag.notifyException(new Error("Example error"));

      testRequest(function (request, url, params) {
        expect(request).to.not.have.been.called;
      });
    });
      
    it("should contain an apiKey", function () {
      Bugsnag.notifyException(new Error("Example error"));

      testRequest(function (request, url, params) {
        expect(request).to.have.been.calledOnce;
        expect(params).to.have.property("apiKey");
      });
    });
      
    it("should have the right exception class", function () {
      Bugsnag.notifyException(new URIError("Example error"));

      testRequest(function (request, url, params) {
        expect(request).to.have.been.calledOnce;
        expect(params.name).to.equal("URIError");
      });
    });
  
    it("should have the right exception message", function () {
      Bugsnag.notifyException(new Error("Example error"));

      testRequest(function (request, url, params) {
        expect(request).to.have.been.calledOnce;
        expect(params.message).to.equal("Example error");
      });
    });

    it("should contain a stacktrace on supported browsers", function () {
      // Stacktrace is only generated on a throw in Safari
      try {
        throw new Error("Example error");
      } catch (e) {
        Bugsnag.notifyException(e);
      }

      testRequest(function (request, url, params) {
        expect(request).to.have.been.calledOnce;

        if(browserSupportsStacktrace()) {
          expect(params.stacktrace).to.exist;
          expect(params.stacktrace).to.not.be.empty;
        }
      });
    });

    it("should contain a releaseStage if set", function () {
      Bugsnag.releaseStage = "development";
      Bugsnag.notifyException(new Error("Example error"));

      testRequest(function (request, url, params) {
        expect(request).to.have.been.calledOnce;
        expect(params.releaseStage).to.equal("development");
      });
    });

    it("should contain global metaData if set", function () {
      var metaData = {some: {data: "here"}};

      Bugsnag.metaData = metaData;
      Bugsnag.notifyException(new Error("Example error"));

      testRequest(function (request, url, params) {
        expect(request).to.have.been.calledOnce;
        expect(params.metaData).to.deep.equal(metaData);
      });
    });

    it("should contain local metaData if set", function () {
      var metaData = {some: {data: "here"}};

      Bugsnag.notifyException(new Error("Example error"), metaData);

      testRequest(function (request, url, params) {
        expect(request).to.have.been.calledOnce;
        expect(params.metaData).to.deep.equal(metaData);
      });
    });

    it("should contain merged metaData if both local and global metaData are set", function () {
      var globalMetaData = {some: {data: "here"}};
      var localMetaData = {some: {extra: {data: "here"}}};

      Bugsnag.metaData = globalMetaData;
      Bugsnag.notifyException(new Error("Example error"), localMetaData);

      testRequest(function (request, url, params) {
        expect(request).to.have.been.calledOnce;
        expect(params.metaData).to.deep.equal({
          some: {
            data: "here",
            extra: {
              data: "here"
            }
          }
        });
      });
    });

    it("should use the https://notify.bugsnag.com/js endpoint by default", function () {
      Bugsnag.notifyException(new Error("Example error"));

      testRequest(function (request, url, params) {
        expect(request).to.have.been.calledOnce;
        expect(url).to.equal("https://notify.bugsnag.com/js");
      });
    });
  });

  describe("onerror", function () {
    // TODO: Implement these tests. This is difficult because Mocha uses window.onerror
    it("should notify bugsnag");
    it("should call the original onerror");
  });
});


function buildUp(cb) {
  // Stub out head.appendChild (jsonp request)
  var head = document.getElementsByTagName("head")[0];
  sinon.stub(head, "appendChild");

  // Keep track of mocha's window.onerror
  window._onerror = window.onerror;

  // Add the bugsnag.js script tag
  var bugsnag = document.createElement("script");
  bugsnag.id = "bugsnag";
  bugsnag.type = "text/javascript";
  bugsnag.src = "../dist/bugsnag.js";
  bugsnag.onload = function () {
    Bugsnag.apiKey = "9e68f5104323042c09d8809674e8d05c";    
    cb();
  };
  document.getElementsByTagName("body")[0].appendChild(bugsnag);
}

function tearDown() {
  // Remove the bugsnag.js script tag
  var bugsnag = document.getElementById("bugsnag");
  bugsnag.parentNode.removeChild(bugsnag);

  // Remove the Bugsnag object
  delete window.Bugsnag;

  // Reset mocha's window.onerror
  window.onerror = window._onerror;
  delete window._onerror;

  // Un-stub head.appendChild
  document.getElementsByTagName("head")[0].appendChild.restore();
}

function testRequest(testCallback) {
  var appendChild = document.getElementsByTagName("head")[0].appendChild;
  var url;
  var params = {};

  if(appendChild.called) {
    var src = appendChild.args[0][0].src;
    expect(src).to.not.be.empty;

    var parts = src.split("?");
    url = parts[0];
    params = qs.parse(parts[1]);
  }

  // Call the test callback
  testCallback(appendChild, url, params);
}

function browserSupportsStacktrace() {
  try {
    throw new Error("test");
  } catch (exception) {
    return exception.stack || exception.backtrace;
  }
}