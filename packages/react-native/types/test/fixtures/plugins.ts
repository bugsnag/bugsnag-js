import Bugsnag from "../../..";
Bugsnag.start();
Bugsnag.use({
  name: 'foobar',
  init: client => 10
})
console.log(Bugsnag.getPlugin('foo') === 10)
