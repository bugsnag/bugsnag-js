# @bugsnag/browserlite

This example demonstrates `@bugsnag/browserlite`, a minimal build of the Bugsnag
browser notifier. Unlike `@bugsnag/js`/`@bugsnag/browser`, it only bundles the
plugins required for basic error/unhandled-rejection capture by default - everything
else (breadcrumbs, sessions, device/context metadata, etc.) is opt-in via the
`plugins` config option, so you only ship the code your app actually uses.

The app is bundled with [browserify](https://browserify.org/) since, unlike
`@bugsnag/js`, `@bugsnag/browserlite` and its optional plugin packages are plain
npm/CommonJS packages rather than a single pre-bundled CDN script.

## What this example shows

- **`liteHandled` / `liteUnhandled` buttons** - use the default lite client, which
  only has `plugin-window-onerror` and `plugin-window-unhandled-rejection` bundled.
- **`pluginHandled` button** - uses a second client created with
  `Bugsnag.createClient()`, demonstrating how to opt in to extra functionality
  (`@bugsnag/plugin-browser-session` and `@bugsnag/plugin-network-breadcrumbs`) via
  the `plugins` config option.

## Usage

Clone the repo and `cd` into the directory of this example:

```
git clone git@github.com:bugsnag/bugsnag-js.git --recursive
cd bugsnag-js/examples/js/browserlite
```

Firstly, replace `YOUR_API_KEY` in [app.js](app.js) with your own, then use the
instructions below to run the application.

Once the app is running, open http://localhost:65532/ in a browser to interact with it.

### With docker

```
docker build -t bugsnag-js-example-browserlite . && \
docker run -it -p 65532:65532 bugsnag-js-example-browserlite
```

### Without docker

Ensure you have a version of Node.js >=14 on your machine.

```
npm install
npm start
```

This installs `@bugsnag/browserlite` and the demo plugin packages, bundles
`app.js` into `dist/bundle.js` with browserify, and serves the page.

> Note: while `@bugsnag/browserlite` is unreleased, `npm install` will fail with a
> 404 until it is published. To test locally against this repo's unreleased
> version in the meantime, build the package first (`cd ../../../packages/browserlite
> && npm run build`) and temporarily point the dependencies in
> [package.json](package.json) at `file:../../../packages/<name>` instead.
