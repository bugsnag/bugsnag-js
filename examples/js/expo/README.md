# Expo

This is an example project showing how to use `@bugsnag/expo` with an Expo application.

## Usage

Clone the repo and `cd` into the directory of this example:

```
git clone git@github.com:bugsnag/bugsnag-js.git
cd bugsnag-js/examples/js/expo
```

Take a look at…
- [`App.js`](App.js) to see Bugsnag is initialized, how the `ErrorBoundary` is used and [`components/ErrorFallback.js`](components/ErrorFallback.js) to see how it is implemented
- [`screens/HomeScreen.js`](screens/HomeScreen.js) for how various errors are triggered for the purpose of this example

Make sure you have the Expo CLI installed:

```sh
npm install -g expo-cli
```

Install the dependencies of this example app:

```sh
yarn
```

Replace `YOUR_API_KEY` in [`app.json`](app.json) with an actual API key.

Then run the app using Expo's CLI:

```sh
expo start
```

Once it's up and running, the Expo CLI will output instructions on how to load the app using a physical or virtual mobile device.

Note that while running the application in development mode, you won't see full stacktraces in the dashboard. To do so you'll need to have an Expo account and run `expo publish`. When you publish an app, Bugsnag automatically uploads source maps for that release, enabling full stacktraces. See [our Expo docs](https://docs.bugsnag.com/platforms/react-native/expo) for more details.
