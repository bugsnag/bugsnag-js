import Bugsnag from "../../..";
Bugsnag.init('api_key')
Bugsnag.use({
  name: 'foobar',
  init: client => 10
})
console.log(Bugsnag.getPlugin('foo') === 10)
