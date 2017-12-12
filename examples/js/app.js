
// www.bugsnag.com
// https://github.com/bugsnag/bugsnag-js/tree/master/examples/js
//
// this example app demosntrates some of the basic syntax to get
// Bugsnag error reporting configured in your Javascript code.
// ***********************************************************

document.getElementById("jsHandled").addEventListener("click", send_handled); 
document.getElementById("jsMetadata").addEventListener("click", send_metadata); 


// Below function will catch an error, and shows how 
// you can add/modify information to the report right before sending.
// Note that the configuration and beforeSend defined in the earlier 
// initialization of bugsnag (in the html) will be applied *after* 
// the statements executed here in notify().
function send_handled() { 
  console.log("handled sent")
    try {
      // deliberate Reference Error
        console.log(doesntExist);
    } 
    catch (e) {
        bugsnagClient.notify(e, { 
          // most errors will have a default context, but you can override.
            context: "a handled ReferenceError",
          // default: unhandlesd = error, handled = warning, but you can override.
            severity: "info"
          });            
    }
}


// Below function is a second example of reporting an handled error
// to bgusnag, this time including some metadata. Note that metadata
// can be declared globally, in the noticification (as below) or 
// in a beforeSend.
function send_metadata() {
  console.log("metadata sent")
    try {
      // deliberate Reference Error
        console.log(doesntExist);
    } 
    catch (e) {
        bugsnagClient.notify(e, { 
            context: "a handled ReferenceError with metadata",
            severity: "error",
            metaData: {
              company: {
                  name: "Xavier's School for Gifted Youngsters"
                }
            }
          });            
    }
}

// Below function will, on every pagesload, trigger an unhandled error,
// which will report to bugsnag, along with all the info configured
// in the initialization of bugsnag in the html.
function send_unhandled() {
    var num = 1;
    // deliberate Type Error
    num.toUpperCase(); 
}

// below is the simplest notification syntax, akin to logging.
bugsnagClient.notify("End of file");

send_unhandled();
// Note that bugsang sets a limit of 10 notifications per page load,



