import bugsnag from "../../..";
const bugsnagClient = bugsnag('api_key');
bugsnagClient.notify(new Error('123'), (event) => {
  return false
}, (err, event) => {
  console.log(event.originalError)
})
