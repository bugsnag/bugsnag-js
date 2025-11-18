# React

This is an example project showing how to use `@bugsnag/js` with a React project.

This project was bootstrapped with [`create-react-app`](https://github.com/facebook/create-react-app).

## Usage

Clone the repo and `cd` into the directory of this example:

```
git clone git@github.com:bugsnag/bugsnag-js.git --recursive
cd bugsnag-js/examples/ts/react-v19
```
Take a look at...:
- [`src/App.tsx`](src/App.tsx) to see how to setup Bugsnag once for your application and how the `ErrorBoundary` is used and to see how the errors are triggered
- [`src/components/ErrorActionButtons.tsx](src/components/ErrorActionButtons.tsx) to see how errors are triggered

### With docker

The project includes a `Dockerfile`. If you're familiar with docker, this is the easiest way to start the example. Otherwise, skip ahead to the [without docker](#without-docker) section.

```
docker build -t bugsnag-ts-example-react . && \
docker run -p 5000:5000 -it bugsnag-ts-example-react
```

__Note__: remember to replace `YOUR_API_KEY` in `src/lib/bugsnag.js` with your own!

### Without docker

Ensure you have a version of Node.js >=4 on your machine.

```
npm install
npm run start
```
__Note__: remember to replace `YOUR_API_KEY` in `src/index.js` with your own!
