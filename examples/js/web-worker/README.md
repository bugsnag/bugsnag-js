# Web-Worker

This is an example project showing how to use `@bugsnag/web-worker` with a web worker or service worker.

The project contains a single page which spawns 2 web workers and 1 service worker. Each worker has its own instance of `@bugsnag/web-worker`, and the web page itself is using an instance of `@bugsnag/js`. 

By default the BugSnag `web-worker` package will not report unhandled errors from the worker script. If you have BugSnag running in the worker’s host web app this will leave unhandled errors to propagate up to the browser context. As these errors are in the same context as the BugSnag sessions, they will impact the stability score. However they will not contain any breadcrumbs or metadata added from within the worker context – these will only be present in handled errors.

If you choose to enable automatic error detection in the `web-worker` using the [`autoDetectErrors` configuration option](https://docs.bugsnag.com/platforms/javascript/configuration-options/#autodetecterrors), the errors reported from within the worker will have the breadcrumbs and metadata set within the worker, but these errors will not be tied to the browser sessions and will not impact the stability score.

Similarly, the BugSnag `web-worker` package does not report sessions by default. If you are using a worker hosted in your own web app the sessions should be managed by the host web app as it is this that users engage with directly. However, if you wish to treat the worker independently from the host web app, automatic session tracking can be enabled in the `web-worker` package using the [`autoTrackSessions` configuration option](https://docs.bugsnag.com/platforms/javascript/configuration-options/#autotracksessions).

In the case of this example, [`worker-propagation.js`](worker-propagation.js) has both `autoDetectErrors` and `autoTrackSessions` set to `false`, leaving the web app responsible for reporting. [`worker-no-propagation.js`](worker-no-propagation.js) has `autoDetectErrors` and `autoTrackSessions` set to `true`, while utilising `preventDefault` in the [parent script](worker-registration.js) to stop any error propagation. This ensures that this worker will only be reported by itself.

Unhandled errors in service workers will never propagate to the web app, so [`service-worker.js`](service-worker.js) is also set up to report its own errors.

## Usage

Clone the repo and `cd` into the directory of this example:

```
git clone git@github.com:bugsnag/bugsnag-js.git --recursive
cd bugsnag-js/examples/js/web-worker
```

Firstly, replace `YOUR_API_KEY` with your own in [`index.html`](index.html), [`worker-propagation.js`](worker-propagation.js), [`worker-no-propagation.js`](worker-no-propagation.js) and [`service-worker.js`](service-worker.js).

### Running the Example

Ensure you have a version of Node.js >=14 on your machine.

```
npm install
npm start
```

Once started, it will serve the app at http://localhost:8066 with handled and unhandled error buttons for each worker.
