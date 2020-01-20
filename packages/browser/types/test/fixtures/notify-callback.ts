import Bugsnag from "../../..";
Bugsnag.start('api_key');
Bugsnag.notify(new Error('123'), (event) => {
  return false
}, (err, event) => {
  console.log(event.originalError)
})
