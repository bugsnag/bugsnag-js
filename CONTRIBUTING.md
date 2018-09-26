# Contributing

Thanks for stopping by! This document should cover most topics surrounding contributing to this repo.

* [How to contribute](#how-to-contribute)
  * [Reporting issues](#reporting-issues)
  * [Fixing issues](#fixing-issues)
  * [Adding features](#adding-features)
* [System requirements](#system-requirements)
* [Testing](#testing)

'[GitHub] bugsnag-js - having trouble getting started with Bugsnag'

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
- Optional: [ruby](https://www.ruby-lang.org/en/) and [bundler](https://bundler.io/) for running end to end tests locally

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
cd packages/browser && bundle
cd ../node && bundle
cd ../..
```

Install dependencies of each package:
```sh
npx lerna bootstrap
```

Build any package that requires building:
```sh
npx lerna build
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

#### Browser

These tests require the `BROWSER` environment variable to be set (choose a value from [`packages/browser/features/browsers.yml`](/packages/browser/features/browsers.yml)). It also requires some browserstack credentials to be set in your environment.

```sh
BROWSER=chrome_61 npm run test:browser
```

#### Node

These tests require docker to be running.

```sh
npm run test:node
```

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
# note you will need to source the npm opt from your 2FA provider
 NPM_CONFIG_OTP=XXXXXX lerna publish from-git --npm-tag next
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
NPM_CONFIG_OTP=XXXXXXX lerna publish from-git
lerna run cdn-upload
```
