// Micro stubbing library, works in more browsers than sinon
function stub(obj, fname) {
  origFunction = obj[fname];
  returnValue = undefined;
  obj[fname] = function () {
    var self = obj[fname];
    self.args = self.args || [];
    self.args.push(arguments);
    self.calledCount = self.calledCount ? self.calledCount + 1 : 1;
    self.calledOnce = (self.calledCount == 1);
    self.called = true;
    self.restore = function () { obj[fname] = origFunction; };
    return returnValue === undefined ? self : returnValue;
  };

  obj[fname].restore = function () { obj[fname] = origFunction; };
  obj[fname].origFunction = origFunction;
  obj[fname].called = false;
  obj[fname].calledOnce = false;
  obj[fname].calledCount = 0;

  return {
    returns: function (val) { returnValue = val; }
  }
}
