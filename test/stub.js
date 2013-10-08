// Micro stubbing library, works in more browsers than sinon
function stub(obj, fname) {
  origFunction = obj[fname];
  obj[fname] = function () {
    var self = obj[fname];
    self.args = self.args || [];
    self.args.push(arguments);
    self.calledCount = self.calledCount ? self.calledCount + 1 : 1;
    self.calledOnce = (self.calledCount == 1);
    self.called = true;
    self.restore = function () { obj[fname] = origFunction };
    return self;
  };

  obj[fname].origFunction = origFunction;
  obj[fname].called = false;
  obj[fname].calledOnce = false;
  obj[fname].calledCount = 0;
}