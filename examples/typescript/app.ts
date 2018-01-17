/// <reference path="./node_modules/bugsnag-js/types/global.d.ts" />

// ***********************************************************
// www.bugsnag.com
// https://github.com/bugsnag/bugsnag-js/tree/master/examples/typescript
//
// this example app demonstrates some of the basic syntax to get Bugsnag error reporting configured in your Typescript code.
// ***********************************************************

var bugsnagClient = bugsnag({
        // get your own api key at bugsnag.com
        apiKey: 'API_KEY',

        // if you track deploys or use source maps, make sure to set the correct version.
        appVersion: '1.2.3',

        // Bugsnag can track the number of “sessions” that happen in your application, and calculate a crash rate for each release. This defaults to false.
        autoCaptureSessions: true,

        // defines the release stage for all events that occur in this app.
        releaseStage: 'development',

        //  defines which release stages bugsnag should report. e.g. ignore staging errors.
        notifyReleaseStages: [ 'development', 'production'],

        // one of the most powerful tools in our library, beforeSend lets you evaluate, modify, add and remove data before sending the error to bugsnag. The actions here will be applied to *all* errors, handled and unhandled.
        // the below downgrades handled exceptions sent with the generic "Error" class to info. In this example, it only affects the notification called at the very end of this app.ts.
        beforeSend: function (report) {
          if (report.errorClass === "Error" && report.severity === "warning")  {
            report.severity = "info"
          }
        },

        user: {
          name: "Grace Hopper",
          email: "ghopper@code.com",
          id: "123456789"
        },

        // add any custom attributes relevant to your app. Note that metadata can be added here, in a specific notify or in a beforeSend.
        metaData: { company: {
          name: "Xavier's School for Gifted Youngsters"
          }
        },

        // because this is a demo app, below extends the default of 10 notifications per pageload. click away!
        maxEvents: 50
      })


// event listeners
var handled: HTMLElement = document.getElementById('jsHandled')!
handled.addEventListener('click', sendHandled)

var unhandled: HTMLElement = document.getElementById('jsUnhandled')!
unhandled.addEventListener('click', sendUnhandled)
// ---

// variables used to trigger errors in the functions below.
var el: HTMLInputElement = <HTMLInputElement> document.getElementById('jsondata')
var rawjson: string = el.value || ''

// Below function will catch an error, and shows how you can add/modify information to the report right before sending.
// Note that the beforeSend defined in the earlier initialization of bugsnag above will be applied *after* the statements executed here in notify().
function sendHandled() {
  try {
    // potentially buggy code goes here
    JSON.parse(rawjson)
  } catch (e) {
    console.log('a handled error with 2 sets of metadata has been reported to your Bugsnag dashboard')
    bugsnagClient.notify(e, {
      metaData: {
        content:  { rawjson: rawjson }
      }
    })
  }
}

// Below function will trigger an unhandled error which will report to bugsnag, without any explcit reference to the client here.
function sendUnhandled() {
  console.log('an unhandled error has been reported to your Bugsnag dashboard')
  // below is throwing and exception, but all data is missing. :(
  throw('Bad thing!')
}

// below is the simplest notification syntax, akin to logging.
console.log('a notification with 1 set of metadata has been reported to your Bugsnag dashboard')
bugsnagClient.notify("End of file")
