# Web-Worker

This is an example project showing how to use `@bugsnag/web-worker` with a web worker.

## Usage

Clone the repo and `cd` into the directory of this example:

```
git clone git@github.com:bugsnag/bugsnag-js.git --recursive
cd bugsnag-js/examples/js/web-worker
```

Take a look at…
- [`worker.js`](worker.js) to see how to start BugSnag to capture errors in the worker
- [`script.js`](script.js) to see how to prevent duplicate events being reported when also using BugSnag in the parent script that initializes the worker

Firstly, replace `YOUR_API_KEY` in [`worker.js`](worker.js) with your own, then use the instructions below to run the application.

### Running the Example

Ensure you have a version of Node.js >=14 on your machine.

```
npm install
npm start
```

Once started, it will serve a page at http://localhost:8067 with buttons that trigger handled and unhandled errors within the worker.