# Web-Worker

This is an example project showing how to use `@bugsnag/web-worker` with a web worker or service worker.

The project contains 2 pages, both of which spawn their own dedicated web worker and service worker.

`web-app-reports-unhandled` has BugSnag instantiated in the workers AND the web app.

`worker-reports-unhandled` ONLY has BugSnag instantiated in the workers.

By default the BugSnag `web-worker` package will not report unhandled errors from the worker script. If you have BugSnag running in the worker’s host web app this will leave unhandled errors to propagate up to the browser context. As these errors are in the same context as the BugSnag sessions, they will impact the stability score. However they will not contain any breadcrumbs or metadata added from within the worker context – these will only be present in handled errors.

If you choose to enable automatic error detection in the `web-worker` using the [`autoDetectErrors` configuration option](https://docs.bugsnag.com/platforms/javascript/configuration-options/#autodetecterrors), the errors reported from within the worker will have the breadcrumbs and metadata set within the worker, but these errors will not be tied to the browser sessions and will not impact the stability score.

Similarly, the BugSnag `web-worker` package does not report sessions by default. If you are using a worker hosted in your own web app the sessions should be managed by the host web app as it is this that users engage with directly. However, if you wish to treat the worker independently from the host web app, automatic session tracking can be enabled in the `web-worker` package using the [`autoTrackSessions` configuration option](https://docs.bugsnag.com/platforms/javascript/configuration-options/#autotracksessions).

## Usage

Clone the repo and `cd` into the directory of this example:

```
git clone git@github.com:bugsnag/bugsnag-js.git --recursive
cd bugsnag-js/examples/js/web-worker
```

Take a look at…
- Any file with the `worker.js` suffix to see how to start and configure BugSnag within a worker
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
