import bugsnag from "../../..";
const bugsnagClient = bugsnag('api_key');
bugsnagClient.use({
  name: 'foobar',
  init: client => 10
})
console.log(bugsnagClient.getPlugin('foo') === 10)
