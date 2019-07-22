# Testing the Bugsnag JS notifier

## Initial setup

Clone and navigate to this repo:

```sh
git clone git@github.com:bugsnag/bugsnag-js.git
cd bugsnag-js
```

Install top level dependencies:

```js
npm i
```

Bootstrap all of the individual packages:

```sh
npm run bootstrap
```

Build each of the standalone packages:

```sh
npm run build
```

## Unit tests

Runs the unit tests for each package.

```sh
npm run test:unit
```

## Type tests

This tests the validity of TypeScript typing files, and lints them using tslint.

```sh
npm run test:types
```

## Linting

Lints the entire repo using standardjs rules.

```sh
npm run test:lint
```

## End to end

These tests are implemented with our notifier testing tool [Maze runner](https://github.com/bugsnag/maze-runner).

End to end tests are written in cucumber-style `.feature` files, and need Ruby-backed "steps" in order to know what to run. The tests are located in the top level [`test`](/test/) directory.

Maze runner's CLI and the test fixtures are containerised so you'll need Docker (and Docker Compose) to run them.

__Note: only Bugsnag employees can run the end-to-end tests.__ We have dedicated test infrastructure and private BrowserStack credentials which can't be shared outside of the organisation.

#### Authenticating with the private container registry

You'll need to set the credentials for the aws profile in order to access the private docker registry:

```
aws configure --profile=opensource
```

Subsequently you'll need to run the following commmand to authenticate with the registry:

```
npm run test:test-container-registry-login
```

__Your session will periodically expire__, so you'll need to run this command to re-authenticate when that happens.

### Browser

The browser tests drive real, remote browsers using BrowserStack. As a Bugsnag employee you can access the necessary credentials in our shared password manager.

The following environment variables need to be set:

- `BROWSER` (the browser you want to test on – choose a key from [`test/browser/features/browsers.yml`](/test/browser/features/browsers.yml))
- `BROWSER_STACK_USERNAME`
- `BROWSER_STACK_ACCESS_KEY`

```sh
BROWSER=chrome_61 \
BROWSER_STACK_USERNAME=xxx \
BROWSER_STACK_ACCESS_KEY=xxx \
  npm run test:browser
```

To run a single feature file:

```sh
BROWSER=chrome_61 \
BROWSER_STACK_USERNAME=xxx \
BROWSER_STACK_ACCESS_KEY=xxx \
  npm run test:browser -- features/unhandled_errors.feature
```

### Node

To run the Node test suite:

```sh
npm run test:node
```

You can use the `NODE_VERSION` env var to choose which version of Node to run the tests on. The default version is `10`.

To run a single feature file:

```sh
npm run test:node -- features/unhandled_errors.feature
```

### Expo

The Expo tests drive real, remote mobile devices using BrowserStack. As a Bugsnag employee you can access the necessary credentials in our shared password manager.

They also require access to the Expo ecosystem in order to publish, then build, the installable app packages. As above, these credentials can also be found in the shared password manager.

The following environment variables need to be set:

- `DEVICE_TYPE`: the mobile operating system you want to test on – one of ANDROID_5, ANDROID_6, ANDROID_7, ANDROID_8, ANDROID_9, IOS_10, IOS_11, IOS_12
- `BROWSER_STACK_USERNAME`
- `BROWSER_STACK_ACCESS_KEY`
- `EXPO_USERNAME`
- `EXPO_PASSWORD`

To run against an android device:

```sh
DEVICE_TYPE=ANDROID_9 \
BROWSER_STACK_USERNAME=xxx \
BROWSER_STACK_ACCESS_KEY=xxx \
EXPO_USERNAME=xxx \
EXPO_PASSWORD=xxx \
  npm run test:expo:android
```

To run against an iOS device, several additional details are required. In order to provision the app the `Expotest.mobileprovision` and its accompanying certificates need to be downloaded from the shared engineering document store and additional environment variables need to be set:

- `APPLE_TEAM_ID`: The team ID to use when building the application
- `EXPO_PROVISIONING_PROFILE_PATH`: The path to the `Expotest.mobileprovision` file as mentioned above
- `EXPO_P12_PATH`: The path to the `Certificates.p12` file as mentioned above
- `EXPO_IOS_DIST_P12_PASSWORD`: The password required for the above certificate

To run against an iOS device:

```sh
DEVICE_TYPE=IOS_10 \
BROWSER_STACK_USERNAME=xxx \
BROWSER_STACK_ACCESS_KEY=xxx \
EXPO_USERNAME=xxx \
EXPO_PASSWORD=xxx \
APPLE_TEAM_ID=xxx \
EXPO_PROVISIONING_PROFILE_PATH=xxx \
EXPO_P12_PATH=xxx \
EXPO_IOS_DIST_P12_PASSWORD=xxx \
  npm run test:expo:ios
```