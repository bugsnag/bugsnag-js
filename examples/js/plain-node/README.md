# Plain Node.js

This is an example project showing how to use `@bugsnag/js` with a basic Node.js project.

## Usage

Clone the repo and `cd` into the directory of this example:

```
git clone git@github.com:bugsnag/bugsnag-js.git --recursive
cd bugsnag-js/examples/js/plain-node
```

Use the instructions below to run the application. When it runs, the output will look something like the following:

```
[bugsnag] Loaded!

  Welcome to the plain Node.js example app. Type one of the
  following keys, followed by enter, to perform each action:

  u = report an (u)nhandled error
    Throws an error which will crash the process. Bugsnag will keep the process
    alive just long enough to report the error before allowing it to exit.

  h = report a (h)andled error
    Creates a new error and reports it with a call to .notify(err).

  l = (l)eave a breadcrumb
    Calls the leaveBreadcrumb() method.

  o = calling notify with an (o)n error callback
    Runs custom logic before an event is sent. This contrived example will
    pseudo-randomly prevent 50% of the events from sending.
```

Take a look at [app.js](app.js) to see how each action is implemented.

### With docker

The project includes a `Dockerfile`. If you're familiar with docker, this is the easiest way to start the example. Otherwise, skip ahead to the [without docker](#without-docker) section.

```
docker build -t bugsnag-js-example-node . && \
docker run -it -e BUGSNAG_API_KEY='YOUR_API_KEY' bugsnag-js-example-node
```

__Note__: remember to replace `YOUR_API_KEY` in the command with your own!

### Without docker

Ensure you have a version of Node.js >=4 on your machine.

```
npm install
BUGSNAG_API_KEY=YOUR_API_KEY npm start
```
__Note__: remember to replace `YOUR_API_KEY` in the command with your own!
