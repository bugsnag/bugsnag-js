/// <reference path="./node_modules/bugsnag-js/types/global.d.ts" />

// ***********************************************************
// www.bugsnag.com
// https://github.com/bugsnag/bugsnag-js/tree/master/examples/typescript
//
// this example app demonstrates some of the basic syntax to get Bugsnag error reporting configured in your Javascript code.
// ***********************************************************

var bugsnagClient = bugsnag({ 
        // get your own api key at bugsnag.com
        apiKey: '8b1f5fc2a44d5f6cdbaff524d74c33b1',

        // if you track deploys or use source maps, make sure to set the correct version.
        appVersion: '1.2.3',

        // defines the release stage for all events that occur in this app.
        releaseStage: 'development',

        //  defines which release stages bugsnag should report. e.g. ignore staging errors.
        notifyReleaseStages: [ 'development', 'production'],

        // one of the most powerful tools in our library, beforeSend lets you evaluate, modify, add and remove data before sending to bugsnag. The actions here will be applied to *all* errors, handled and unhandled.
        beforeSend: function (report) {
          report.user = {
            name: "Grace Hopper",
            email: "ghopper@code.com",
            id: "123456789"
          };
        },
        // because this is a demo app, below extends the default of 10 notifications per pageload. click away!
        maxEvents: 50
      });


var el: HTMLInputElement = <HTMLInputElement> document.getElementById('jsondata')
var rawjson: string = el.value || ''

try {
  JSON.parse(rawjson)
} catch (e) {
  bugsnagClient.notify(e, { metaData: { rawjson: rawjson } })
}


// below is the simplest notification syntax, akin to logging.
bugsnagClient.notify("End of file");
