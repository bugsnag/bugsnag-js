# Browser CDN

This is an example project showing how to use the CDN delivered version of `@bugsnag/js` in the browser.

## Usage

Clone the repo and `cd` into the directory of this example:

```
git clone git@github.com:bugsnag/bugsnag-js.git --recursive
cd bugsnag-js/examples/js/browser-cdn
```

Firstly, replace the `YOUR_API_KEY` in [app.js](app.js) with your own, then use the instructions below to run the application.

Once the app is running, to interact with it, open this link in a browser: http://localhost:65531/

### With docker

The project includes a `Dockerfile`. If you're familiar with docker, this is the easiest way to start the example. Otherwise, skip ahead to the [without docker](#without-docker) section.

```
docker build -t bugsnag-js-example-browser-cdn . && \
docker run -it -p 65531:65531 bugsnag-js-example-browser-cdn
```

### Without docker

Ensure you have a version of Node.js >=4 on your machine.

```
npm install
npm start
```
