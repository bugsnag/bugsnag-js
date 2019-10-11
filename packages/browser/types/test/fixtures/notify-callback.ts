import bugsnag from "../../..";
const bugsnagClient = bugsnag('api_key');
bugsnagClient.notify(new Error('123'), {
  beforeSend: (report) => { return false }
}, (err, report) => {
  console.log(report.originalError)
})
