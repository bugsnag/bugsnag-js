/// <reference path="./node_modules/bugsnag-js/types/global.d.ts" />
// above makes the needed definitions available to your Typescript file.

// ***********************************************************
// www.bugsnag.com
// https://github.com/bugsnag/bugsnag-js/tree/master/examples/typescript
//
// this example app demonstrates some of the basic syntax to get Bugsnag error reporting configured in your Typescript code.
// ***********************************************************

// Note that bugsnag-js was loaded at the top of the index.html file, but is not active until initialized below.

// Initialize bugsnag to begin tracking errors. Only an api key is required, but here are some other helpful configuration details:
var bugsnagClient = bugsnag({
    // get your own api key at bugsnag.com
    apiKey: 'API_KEY',

    // if you track deploys or use source maps, make sure to set the correct version.
    appVersion: '1.2.3',

    // defines the release stage for all events that occur in this app.
    releaseStage: 'development',

    //  defines which release stages bugsnag should report. e.g. ignore staging errors.
    notifyReleaseStages: [ 'development', 'production'],

    // one of the most powerful tools in our library, beforeSend lets you evaluate, modify, add and remove data before sending the error to bugsnag. The actions here will be applied to *all* errors, handled and unhandled.
    beforeSend: function (report) {

      // the below downgrades handled exceptions sent with the generic "Error" class to info. In this example, it only affects the notification called at the very end of this file.
      if (report.errorClass === "Error" && report.severity === "warning") {
        report.severity = "info"
      }
      // note that if you return false from the beforeSend, this will cancel the entire error report.
    },

    // attached any user data you'd like to report.
    user: {
      name: "Grace Hopper",
      email: "ghopper@code.com",
      id: "123456789"
    },

    // add any custom attributes relevant to your app. Note that metadata can be added here, in a specific notify() or in a beforeSend.
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


function sendHandled() {
  try {
    // potentially buggy code goes here
    JSON.parse(rawjson)
  } catch (e) {
    console.log('a handled error has been reported to your Bugsnag dashboard')
    bugsnagClient.notify(e, {
      // here you can attach metaData specfic to only this function.
      metaData: {
        content:  { rawjson: rawjson }
      }
    })
  }
}

function sendUnhandled() {
  console.log('an unhandled error has been reported to your Bugsnag dashboard')
  throw(new Error('Bad thing!'))
}

console.log('a manual notification has been reported to your Bugsnag dashboard')
// below is the simplest notification syntax, akin to logging. It would default to a severity level of "warning", but the beforeSend will overwrite this to level "info".
bugsnagClient.notify("End of file")
