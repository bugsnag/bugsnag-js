import Bugsnag from "../../..";
Bugsnag.init('api_key')
Bugsnag.notify(
  new Error('123'),
  (event) => { return false },
  (err, event) => {
    console.log(event.originalError)
  })
