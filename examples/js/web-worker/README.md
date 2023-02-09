# Web-Worker

This is an example project showing how to use `@bugsnag/web-worker` with a web worker or service worker.

BugSnag can be configured to run in different ways inside a worker depending on whether it's a web or service worker and also its relationship with the “host” web app that spawns it. For full details on this, please see our [online docs](https://docs.bugsnag.com/platforms/javascript/web-workers/#reporting-unhandled-errors).

The project contains a single page which spawns 2 web workers and 1 service worker. Each worker has its own instance of `@bugsnag/web-worker`, and the web page itself is using an instance of `@bugsnag/js`.

The BugSnag instance created by [`worker-propagation.js`](worker-propagation.js) has both `autoDetectErrors` and `autoTrackSessions` set to `false`, leaving the web app responsible for reporting. In [`worker-no-propagation.js`](worker-no-propagation.js) BugSnag has `autoDetectErrors` and `autoTrackSessions` set to `true`, while utilizing `preventDefault` in the [parent script](worker-registration.js) to stop any error propagation. This ensures that this worker will only be reported by itself.

Unhandled errors in service workers will never propagate to the web app, so BugSnag [`service-worker.js`](service-worker.js) is also set up to detect errors.

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
