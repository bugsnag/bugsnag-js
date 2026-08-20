# AWS Lambda

This is an example project showing how to use `@bugsnag/js` with AWS Lambda.

This project was initialized with [`sam init`](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-init.html).

## Prerequisites

- [SAM CLI tools](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- [Docker](https://docs.docker.com/get-docker/) is installed and running on your machine (only if testing locally)

## Usage

Clone the repo and `cd` into the directory of this example:

```
git clone git@github.com:bugsnag/bugsnag-js.git
cd bugsnag-js/examples/aws-lambda/simple-app
```

- Bugsnag is started for each Lambda function with `Bugsnag.start` and the `@bugsnag/plugin-aws-lambda` plugin
- Errors in your Lambda are handled by wrapping your Lambda handler inside Bugsnag's handler
- Both async and callback handlers are supported, with examples given for both inside this app

Replace `<YOUR_BUGSNAG_API_KEY>` in `template.yaml` with your own.

### Install dependencies

A Lambda layer is used to share dependencies (Bugsnag) across the functions. From the project root, install the dependencies before invoking the functions:

```
cd dependencies-layer && npm install && cd ..
```

### Build

From the root directory:

```
sam build
```

### Run all functions locally

To run all the functions on a local server:

```
sam local start-api --host '127.0.0.1' -p '3000'
```

To avoid building the dependency layer image on each invocation, you can use the `--warm-containers [EAGER | LAZY]` option. `EAGER` loads the layer containers for all functions at startup + persists them between invocations. `LAZY` only loads the layer containers when each function is first invoked, and then persists them for further invocations.

Hit a function endpoint:

```
curl -X GET 'http://127.0.0.1:3000/async/handled-exception'
```

### Testing a single function

To test a single function using a sample [Event](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-concepts.html#gettingstarted-concepts-event):

```
sam local invoke "<RESOURCE_NAME>" -e <path/to/event.json>
```

e.g. to run the `CallbackHandledException` function:

```
sam local invoke "CallbackHandledException" -e events/callback/handled-exception.json
```

### Available functions

Bugsnag's `createHandler` supports both [`async`](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html#nodejs-handler-async) and [`callback`](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html#nodejs-handler-sync) handlers. Examples are given for both types of handler.
Function Name | Expected Response Code & Message | Purpose
--- | --- | ---
`AsyncUnhandledException`| 502 - Internal server error | Error returned from the handler
`AsyncHandledException` | 200 - Did not crash! | Call to `Bugsnag.notify` inside the handler, successful response
`AsyncPromiseRejection` | 502 - Internal server error | Promise rejected inside handler
`AsyncTimeout` | 502 - Internal server error | Function times out - Bugsnag notifies [`lambdaTimeoutNotifyMs`](https://docs.bugsnag.com/platforms/javascript/aws-lambda/#lambdatimeoutnotifyms) before timeout
`CallbackUnhandledException` | 502 - Internal server error | Error returned using handler's callback function
`CallbackThrownUnhandledException` | 502 - Internal server error | Error thrown inside the handler
`CallbackHandledException` | 200 - Did not crash! | Call to `Bugsnag.notify` inside the handler, successful response
`CallbackPromiseRejection` | 502 - Internal server error | Promise rejected inside handler
`CallbackTimeout` | 502 - Internal server error | Function times out - Bugsnag notifies [`lambdaTimeoutNotifyMs`](https://docs.bugsnag.com/platforms/javascript/aws-lambda/#lambdatimeoutnotifyms) before timeout
