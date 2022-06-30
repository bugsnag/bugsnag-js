# Electron basic

This is an example project showing how to use `@bugsnag/electron` in a basic Electron app.

This example app was created with Electron forge.

## Usage

Clone the repo and `cd` into the directory of this example:

```
git clone git@github.com:bugsnag/bugsnag-js.git --recursive
cd bugsnag-js/examples/electron/electron-basic
```

Firstly, replace the `YOUR_API_KEY` placeholder in [src/index.js](src/index.js) with your own, then run the application using `npm start`.

You can also package up the app for your operating system using `npm run package` and run it in the same way you would any other GUI app.

Once the app is running, it will open a window that you can interact with to send various errors and information to Bugsnag.