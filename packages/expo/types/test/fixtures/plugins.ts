import Bugsnag from "../../..";
Bugsnag.start({
  apiKey:'api_key',
  plugins: [{
    name: 'foobar',
    load: client => 10
  }]
});
console.log(Bugsnag.getPlugin('foo') === 10)
