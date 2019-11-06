import Bugsnag, { Client } from "../../..";
Bugsnag.init('api_key')
Bugsnag.use({
  name: 'foobar',
  init: (client: Client) => 10
})
console.log(Bugsnag.getPlugin('foo') === 10)
