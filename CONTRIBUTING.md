# Contributing

Thanks for stopping by! This document should cover most topics surrounding contributing to this repo.

* [How to contribute](#how-to-contribute)
  * [Reporting issues](#reporting-issues)
  * [Fixing issues](#fixing-issues)
  * [Adding features](#adding-features)
* [System requirements](#system-requirements)
* [Testing](#testing)

## Reporting issues
Are you having trouble getting started? Please [contact us directly](mailto:support@bugsnag.com?subject=%5BGitHub%5D%20bugsnag-js%20-%20having%20trouble%20getting%20started%20with%20Bugsnag) for assistance with integrating Bugsnag into your application.
If you have spotted a problem with this module, feel free to open a [new issue](https://github.com/bugsnag/bugsnag-js/issues/new?template=Bug_report.md). Here are a few things to check before doing so:

* Are you using the latest version of Bugsnag? If not, does updating to the latest version fix your issue?
* Has somebody else [already reported](https://github.com/bugsnag/bugsnag-js/issues?utf8=%E2%9C%93&q=is%3Aissue%20is%3Aopen) your issue? Feel free to add additional context to or check-in on an existing issue that matches your own.
* Is your issue caused by this module? Only things related to `@bugsnag/js` (including `@bugsnag/plugin-*` plugins to support various frameworks) should be reported here. For anything else, please [contact us directly](mailto:support@bugsnag.com) and we'd be happy to help you out.

### Fixing issues

If you've identified a fix to a new or existing issue, we welcome contributions!
Here are some helpful suggestions on contributing that help us merge your PR quickly and smoothly:

* [Fork](https://help.github.com/articles/fork-a-repo) the
  [library on GitHub](https://github.com/bugsnag/bugsnag-js)
* Build and test your changes. We have automated tests for many scenarios but its also helpful to use `npm pack` to build the module locally and install it in a real app.
* Commit and push until you are happy with your contribution
* [Make a pull request](https://help.github.com/articles/using-pull-requests)
* Ensure the automated checks pass (and if it fails, please try to address the cause)

### Adding features

Unfortunately we’re unable to accept PRs that add features or refactor the library at this time.
However, we’re very eager and welcome to hearing feedback about the library so please contact us directly to discuss your idea, or open a
[feature request](https://github.com/bugsnag/bugsnag-js/issues/new?template=Feature_request.md) to help us improve the library.

Here’s a bit about our process designing and building the Bugsnag libraries:

* We have an internal roadmap to plan out the features we build, and sometimes we will already be planning your suggested feature!
* Our open source libraries span many languages and frameworks so we strive to ensure they are idiomatic on the given platform, but also consistent in terminology between platforms. That way the core concepts are familiar whether you adopt Bugsnag for one platform or many.
* Finally, one of our goals is to ensure our libraries work reliably, even in crashy, multi-threaded environments. Oftentimes, this requires an intensive engineering design and code review process that adheres to our style and linting guidelines.


## System requirements

In order to develop on the project you’ll need to be on Mac/Linux٭. You’ll need:
- [node](https://nodejs.org) `v8+` (which includes [npm](https://www.npmjs.com/get-npm) 5+)
- [git](https://git-scm.com/)

If you want to run the end-to-end tests locally you'll need [Docker](https://www.docker.com/products/docker-desktop) (including Docker Compose), and the [AWS CLI](https://aws.amazon.com/cli/). Note that you'll also need some BrowserStack and AWS credentials which are only available to Bugsnag employees.

## Testing

### Initial setup

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

### Unit tests

Runs the unit tests for each package.

```sh
npm run test:unit
```

### Type tests

This tests the validity of TypeScript typing files, and lints them using tslint.

```sh
npm run test:types
```

### Linting

Lints the entire repo using standardjs rules.

```sh
npm run test:lint
```

### End to end

These tests are implemented with our notifier testing tool [Maze runner](https://github.com/bugsnag/maze-runner).

End to end tests are written in cucumber-style `.feature` files, and need Ruby-backed "steps" in order to know what to run. The tests are located in the top level [`test`](/test/) directory.

Maze runner's CLI and the test fixtures are containerised so you'll need Docker (and Docker Compose) to run them.

__Note: only Bugsnag employees can run the end-to-end tests.__ We have dedicated test infrastructure and private BrowserStack credentials which can't be shared outside of the organisation.

##### Authenticating with the private container registry

You'll need to set the credentials for the aws profile in order to access the private docker registry:

```
aws configure --profile=opensource
```

Subsequently you'll need to run the following commmand to authenticate with the registry:

```
npm run test:test-container-registry-login
```

__Your session will periodically expire__, so you'll need to run this command to re-authenticate when that happens.

#### Browser

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

#### Node

To run the Node test suite:

```sh
npm run test:node
```

You can use the `NODE_VERSION` env var to choose which version of Node to run the tests on. The default version is `10`.

To run a single feature file:

```sh
npm run test:node -- features/unhandled_errors.feature
```

#### Expo

The expo tests drive real, remote mobile devices using BrowserStack. As a Bugsnag employee you can access the necessary credentials in our shared password manager.

They also require access to the Expo ecosystem in order to publish, then build, the installable app packages. As above, these credentials can also be found in the shared password manager.

The following environment variables need to be set:

- `DEVICE_TYPE` (the mobile operating system you want to test on – choose a key from [`test/expo/features/lib/devices.rb`](/test/expo/features/lib/devices.rb))
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

To run against an iOS device, several additional details are required. These include:

- `APPLE_TEAM_ID`
- `EXPO_PROVISIONING_PROFILE_PATH`: The provisioning profile required to build the app
- `EXPO_P12_PATH`: The certificate required to sign the app
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
EXPO_IOS_DIST_P12_PASSWORD=xxx
  npm run test:expo:ios
```

## CI

CI runs on Buildkite. Tests are run automatically on any branch from within this repo. PRs from external repos do not run on the private test infrastructure. Once an external PR has been reviewed by a Bugsnag employee, a branch can be created within this repo in order to run on CI.

⚠️ __Caution__: exercise due-diligence before creating a branch based on an external contribution – for example, be sure not to merge a bitcoin miner disguised as a bug fix!

## Prereleases

If you are starting a new prerelease, use one of the following commands:

```
lerna version [premajor | preminor | prepatch]
```

For subsequent iterations on that release, run:

```
lerna version prerelease
```

If you want to publish the release to npm, use the following command:

```
lerna publish from-git --npm-tag next
```

The `--npm-tag next` part ensures that it is not installed by unsuspecting users who do not specify a version.

If you want to publish the release to the CDN, use the following command:

```
lerna run cdn-upload
```

## Releases

To graduate a prerelease into a release you will want to use `patch` as the version.

```
lerna version [major | minor | patch]
lerna publish from-git
lerna run cdn-upload
```
