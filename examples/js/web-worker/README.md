# Web-Worker

This is an example project showing how to use `@bugsnag/web-worker` with a web worker or service worker.

The project contains 2 pages, both of which spawn their own dedicated web worker and service worker.

`web-app-reports-unhandled` has BugSnag instantiated in the workers AND the web app.

`worker-reports-unhandled` ONLY has BugSnag instantiated in the workers.

## Usage

Clone the repo and `cd` into the directory of this example:

```
git clone git@github.com:bugsnag/bugsnag-js.git --recursive
cd bugsnag-js/examples/js/web-worker
```

Take a look at…
- Any file with the `worker.js` suffix to see how to start BugSnag to capture errors in the worker
- [`web-app-reports-web-worker.js`](web-app-reports-unhandled/web-app-reports-web-worker.js) to see how to `autoDetectErrors` and `autoTrackSessions`
- [`web-app-reports-web-script.js`](web-app-reports-unhandled/web-app-reports-web-script.js) to see how to prevent duplicate events being reported when also using BugSnag in the parent script that initializes the worker

Firstly, replace `YOUR_API_KEY` with your own in [`web-app-reports-unhandled.html`](web-app-reports-unhandled/web-app-reports-unhandled.html), [`web-app-reports-web-worker.js`](web-app-reports-unhandled/web-app-reports-web-worker.js) and [`web-app-reports-service-worker.js`](web-app-reports-unhandled/web-app-reports-service-worker.js) if you wish to use BugSnag in both the web app AND workers.

And/or replace `YOUR_API_KEY` with your own in [`worker-reports-web-worker.js`](worker-reports-unhandled/worker-reports-web-worker.js) and [`worker-reports-service-worker.js`](worker-reports-unhandled/worker-reports-service-worker.js) if you wish to ONLY use BugSnag in the workers.

### Running the Example

Ensure you have a version of Node.js >=14 on your machine.

```
npm install
npm start
```

Once started, it will serve a landing page at http://localhost:8066 with links to the 2 pages that spawn their own workers.
