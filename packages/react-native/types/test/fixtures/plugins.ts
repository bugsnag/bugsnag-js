import Bugsnag from "../../..";
Bugsnag.start({
  plugins: [{
    name: 'foobar',
    load: client => 10
  }]
});
console.log(Bugsnag.getPlugin('foo') === 10)
