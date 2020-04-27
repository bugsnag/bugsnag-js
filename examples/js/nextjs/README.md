# Next.js

This is an example project showing how to use the universal `@bugsnag/js` notifier to track both server and browser errors on a Next.js project.

We recommend creating two projects in your dashboard, one for the server errors and one for the browser errors.

## Usage

Clone the repo and `cd` into the directory of this example:

```
git clone git@github.com:bugsnag/bugsnag-js.git
cd bugsnag-js/examples/nextjs
```

Take a look at…
- [`lib/bugsnag.js`](lib/bugsnag.js) for how to setup Bugsnag once for your application so it can be imported and used anywhere on the server or client
- [`next.config.js`](next.config.js) to see how the environment variables are passed through to both the client and server build
- [`pages/_app.js`](pages/_app.js) to see how the React `ErrorBoundary` is used to wrap all pages in the application
- [`pages/_error.js`](pages/_error.js) to see how to override the built-in error page to intercept SSR errors
- [`pages/index.js`](pages/index.js) to see how the errors are triggered
- [`components/CrashyButton.js`](components/CrashyButton.js) to see how the render error is triggered

### With docker

The project includes a `Dockerfile`. If you're familiar with docker, this is the easiest way to start the example. Otherwise, skip ahead to the [without docker](#without-docker) section.

```
docker build -t bugsnag-js-example-next . && \
docker run \
  -e BUGSNAG_SERVER_API_KEY=YOUR_SERVER_API_KEY \
  -e BUGSNAG_BROWSER_API_KEY=YOUR_BROWSER_API_KEY \
  -p 3000:3000 -it bugsnag-js-example-next
```

__Note__: remember to replace the API key environment variables with your own!

### Without docker

Ensure you have a version of Node.js >=4 on your machine.

```
npm install
npm run build
BUGSNAG_SERVER_API_KEY=YOUR_SERVER_API_KEY \
BUGSNAG_BROWSER_API_KEY=YOUR_BROWSER_API_KEY \
  npm start
```
__Note__: remember to replace the API key environment variables with your own!
