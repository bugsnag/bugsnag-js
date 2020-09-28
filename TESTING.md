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

This tests the validity of .d.ts files by attempting to compile a TypeScript program that uses Bugsnag.

```sh
npm run test:types
```

## Linting

Lints the entire repo with ESLint. On JavaScript files this uses the [standard](https://github.com/standard/eslint-config-standard) ruleset and on TypeScript files this uses the [@typescript/eslint](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin) recommended set of rules.

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

Running tests against an iOS device locally is not currently supported.

### React-native

The React-native tests drive real, remote mobile devices using BrowserStack. As a Bugsnag employee you can access the necessary credentials in our shared password manager.

In addition, the react-native test fixture requires the current version of the repo to be published to a locally owned NPM repository (! Not the official NPMJS repository !). This can be locally or remotely hosted, but should be versioned appropriately.  Three bits of information will need to be passed into the test run as environment variables in order to access this package:

- `REG_BASIC_CREDENTIAL`: the basic auth credentials of an account able to access the repository
- `REG_NPM_EMAIL`: the email of the user accessing the repository
- `REGISTRY_URL`: the remote address of the repository

The targeted release of `@bugsnag/react-native` must be tagged with the short hash of the current commit in order to be picked up by the gradle build process.

There may be several react-native versions that can be targeted.  
These should be set to the `REACT_NATIVE_VERSION` environment variable according to the table below:

| React native fixture | `REACT_NATIVE_VERSION` |
|----------------------|------------------------|
| 0.60                 | `rn0.60`               |
| 0.63                 | `rn0.63`               |

The following environment variables need to be set:

- `DEVICE_TYPE` - the mobile operating system you want to test on – one of:
  - ANDROID_5
  - ANDROID_6_0
  - ANDROID_7_1
  - ANDROID_8_1
  - ANDROID_9_0
  - ANDROID_10_0
  - IOS_10
  - IOS_11
  - IOS_12
- `BROWSER_STACK_USERNAME`
- `BROWSER_STACK_ACCESS_KEY`
- `REACT_NATIVE_VERSION`
- `REG_BASIC_CREDENTIAL`
- `REG_NPM_EMAIL`
- `REGISTRY_URL`

By default, the test fixture used to run tests against will be built with a version of @bugsnag/react-native for the current branch/commit, e.g. `7.2.0-my-branch.231f6ef7`.
This can be overridden using the environment variable NOTIFIER_VERSION and is useful during development when making test, but not notifier, changes.

To run against an android device:

```sh
DEVICE_TYPE=ANDROID_9.0 \
REACT_NATIVE_VERSION=rn0.60 \
REG_BASIC_CREDENTIAL=xxx \
REG_NPM_EMAIL=xxx \
REGISTRY_URL=xxx \
BROWSER_STACK_USERNAME=xxx \
BROWSER_STACK_ACCESS_KEY=xxx \
  npm run test:react-native:android
```

To run against an iOS device:

```
DEVICE_TYPE=ANDROID_9.0 \
REACT_NATIVE_VERSION=rn0.60 \
REG_BASIC_CREDENTIAL=xxx \
REG_NPM_EMAIL=xxx \
REGISTRY_URL=xxx \
BROWSER_STACK_USERNAME=xxx \
BROWSER_STACK_ACCESS_KEY=xxx \
  npm run test:react-native:ios
```
