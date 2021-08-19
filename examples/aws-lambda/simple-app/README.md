# AWS Lambda

This is an example project showing how to use `@bugsnag/js` with AWS Lambda.

This project was initialized with [`sam init`](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-cli-command-reference-sam-init.html).

## Prerequsities
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

### Build
```
sam build
```

### Run all functions locally
To run all the functions on a local server:
```
sam local start-api --host '127.0.0.1' -p '3000'
```
Hit a function endpoint:
```
curl -X GET 'http://127.0.0.1:3000/async/handled-exception'
```
### Testing a single function
To test a single function using a sample [Event](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-concepts.html#gettingstarted-concepts-event):
```
sam local invoke "<RESOURCE_NAME>" -e <path/to/event.json>
```
e.g. to run the `CallbackHandledExceptionFunctionNode14` function:
```
sam local invoke "CallbackHandledExceptionFunctionNode14" -e events/callback/handled-exception.json
```

## Known issues

- There is a bug with the SAM CLI that prevents Bugsnag from notifying you of timeouts when running the functions with the SAM CLI, see https://github.com/aws/aws-sam-cli/issues/2519. Timeout examples have been included and should work when deployed to AWS.

