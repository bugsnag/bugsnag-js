// www.bugsnag.com
// https://github.com/bugsnag/bugsnag-js/tree/master/examples/js
//
// this example app demonstrates some of the basic syntax to get Bugsnag error reporting configured in your Javascript code, with source map support.
// ***********************************************************

document.getElementById('jsHandled').addEventListener('click', sendHandled)
document.getElementById('jsUnhandled').addEventListener('click', sendUnhandled)

// Note that Bugsnag was loaded with a CDN link in index.html, but it will not be active until initialized, either in the html or here in the JavaScript.

// Initialize Bugsnag to begin tracking errors. Only an api key is required, but here are some other helpful configuration details:
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
  notifyReleaseStages: [ 'development', 'production' ],

  // one of the most powerful tools in our library, beforeSend lets you evaluate, modify, add and remove data before sending the error to bugsnag. The actions here will be applied to *all* errors, handled and unhandled.
  beforeSend: function (report) {

    // the below downgrades handled exceptions sent with the generic "Error" class to info. In this example, it only affects the notification called at the very end of this app.js.
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


// Below function will catch an error, and shows how you can add/modify information to the report right before sending.
// Note that the beforeSend defined in the earlier initialization of bugsnag above will be applied *after* the statements executed here in notify().
function sendHandled () {
  try {
    // deliberate Reference Error
    console.log(doesntExist)
  } catch (e) {
    console.log('a handled error with metadata has been reported to your Bugsnag dashboard')

    bugsnagClient.notify(e, {
      context: 'a handled ReferenceError with metadata',
      // Note that metadata can be declared globally, in the notification (as below) or in a beforeSend.
      // The below metadata will be supplemented (not replaced) by the metadata in the beforeSend method. See our docs if you prefer to overwrite/remove metadata.
      metaData: {
        details: {
          info: "Any important details specific to the context of this particular error/function."}
        }
    })

  }
}

// Below function will trigger an unhandled error which will report to bugsnag, without any explcit reference to the client here.
function sendUnhandled () {
  console.log('an unhandled error has been reported to your Bugsnag dashboard')
  var num = 1
  // deliberate Type Error
  num.toUpperCase()
}

// below is the simplest notification syntax, akin to logging.
bugsnagClient.notify('End of file')
