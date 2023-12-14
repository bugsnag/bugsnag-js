# Gatsby

This is an example project showing how to use `@bugsnag/js` with a Gatsby application.

In this example the Bugsnag notifier is only initialized in the browser using the `onClientEntry` hook. Uploading of source maps is also demonstrated using the `onCreateWebpackConfig` hook.

## Usage

Clone the repo and `cd` into the directory of this example:

```
git clone git@github.com:bugsnag/bugsnag-js.git --recursive
cd bugsnag-js/examples/js/gatsby
```

Use the instructions below to run the application.

Once started, it will serve a page at http://localhost:9000 with buttons that cause the app to send various errors.

### With docker

The project includes a `Dockerfile`. If you're familiar with docker, this is the easiest way to start the example. Otherwise, skip ahead to the [without docker](#without-docker) section.

```
GATSBY_BUGSNAG_API_KEY=YOUR_API_KEY docker build -t bugsnag-js-example-gatsby .
docker run -p 9000:9000 -it bugsnag-js-example-gatsby
```

__Note__: remember to replace `YOUR_API_KEY` in the command with your own!

### Without docker

Ensure you have a version of Node.js >=14 on your machine.

```
npm install
GATSBY_BUGSNAG_API_KEY=YOUR_API_KEY npm start
```

__Note__: remember to replace `YOUR_API_KEY` in the command with your own!
