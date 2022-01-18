/* global bugsnag */

// www.bugsnag.com
// https://github.com/bugsnag/bugsnag-js/tree/master/examples/browser-cdn
//
// this example app demonstrates some of the basic syntax to get
// Bugsnag error reporting configured in your Javascript code.
// ***********************************************************

document.getElementById('jsHandled').addEventListener('click', sendHandled)
document.getElementById('jsUnhandled').addEventListener('click', sendUnhandled)

// Note that Bugsnag was loaded with a CDN link in index.html, but it will not be
// active until initialized, either in the html or here in the JavaScript.

// Initialize Bugsnag to begin tracking errors. Only an api key is required, but
// here are some other helpful configuration details:
Bugsnag.start({
  // get your own api key at bugsnag.com
  apiKey: 'YOUR_API_KEY',

  // if you track deploys or use source maps, make sure to set the correct version.
  appVersion: '1.2.3',

  // Bugsnag can track the number of “sessions” that happen in your application,
  // and calculate a crash rate for each release. This defaults to true.
  autoTrackSessions: true,

  // defines the release stage for all events that occur in this app.
  releaseStage: 'development',

  //  defines which release stages bugsnag should report. e.g. ignore staging errors.
  enabledReleaseStages: [ 'development', 'production' ],

  // one of the most powerful tools in our library, onError lets you evaluate,
  // modify, add and remove data before sending the error to bugsnag. The actions
  // here will be applied to *all* errors, handled and unhandled.
  onError: function (event) {
    // the below downgrades handled exceptions sent with the generic "Error"
    // class to info. In this example, it only affects the notification called
    // at the very end of this app.js.
    if (event.errors[0].errorClass === 'Error' && event.severity === 'warning') {
      event.severity = 'info'
    }
    // note that if you return false from the onError,
    // this will cancel the entire error event.
  },

  // attached any user data you'd like to event.
  user: {
    name: 'Grace Hopper',
    email: 'ghopper@code.com',
    id: '123456789'
  },

  // add any custom attributes relevant to your app. Note that metadata can be
  // added here, in a specific notify() or in an onError.
  metadata: {
    company: {
      name: "Xavier's School for Gifted Youngsters"
    }
  },

  // because this is a demo app, below extends the default of 10 notifications
  // per pageload. click away!
  maxEvents: 50
})

// Below function will catch an error, and shows how you can add/modify
// information to the event right before sending.
// Note that the onError defined in the earlier initialization of bugsnag
// above will be applied *after* the statements executed here in notify().
function sendHandled () {
  try {
    // deliberate Reference Error
    console.log(doesntExist) // eslint-disable-line
  } catch (e) {
    console.log('a handled error with metadata has been reported to your Bugsnag dashboard')

    Bugsnag.notify(e, event => {
      event.context = 'a handled ReferenceError with metadata'
      // Note that metadata can be declared globally, in the notification (as below) or in an onError.
      // The below metadata will be supplemented (not replaced) by the metadata
      // in the onError method. See our docs if you prefer to overwrite/remove metadata.
      event.addMetadata('details', {
        info: 'Any important details specific to the context of this particular error/function.'
      })
    })
  }
}

// Below function will trigger an unhandled error which will report to bugsnag,
// without any explicit reference to the client here.
function sendUnhandled () {
  console.log('an unhandled error has been reported to your Bugsnag dashboard')
  var num = 1
  // deliberate Type Error
  num.toUpperCase()
}

// below is the simplest notification syntax, akin to logging.
window.Bugsnag.notify('End of file')
