# Contributing

Thanks for stopping by. If you’re here because you’re considering contributing then
🎉 ! This document should have you covered for most things, but if you have any questions
give us a shout ([@bengourley](https://github.com/bengourley) is the current lead
maintainer, feel free to ping him on [Twitter](https://twitter.com/bengourley)).

<!-- toc -->

- [How to contribute](#how-to-contribute)
  * [Reporting issues](#reporting-issues)
  * [Fixing issues](#fixing-issues)
  * [Adding features](#adding-features)
- [System requirements](#system-requirements)
- [QA](#qa)
  * [Testing](#testing)
    + [Unit tests](#unit-tests)
    + [Integration tests](#integration-tests)
    + [End-to-end tests](#end-to-end-tests)
  * [Linting](#linting)
- [Releases](#releases)
  * [Prerelease](#prerelease)
  * [Release](#release)

<!-- tocstop -->

## How to contribute

### Reporting issues

If you think you've spotted a problem with this module, feel free to open up a
[new issue](https://github.com/bugsnag/bugsnag-js/issues/new). There are a couple
of things you should check before doing so:

- Do you have the latest version of bugsnag-js? If not, does updating to the latest
version fix your issue?
- Has somebody else [already reported](https://github.com/bugsnag/bugsnag-js/issues?utf8=%E2%9C%93&q=is%3Aissue%20is%3Aopen) your issue? Feel free to comment or check-in on an existing issue that matches your own.
- Is your problem definitely to do with this module? Only things related to the JavaScript
notifier should be reported here. For anything else, email [support@bugsnag.com](mailto:support@bugsnag.com).

### Fixing issues

If you've identified a fix to a new or existing issue, we welcome contributions!

- Ensure your machine has the [necessary prerequisites](#system-requirements)
- [Fork](https://help.github.com/articles/fork-a-repo) the [repo on github](https://github.com/bugsnag/bugsnag-js)
- Make your changes locally
- Ensure the changes meet the [QA](#QA) standards
- Commit and push your changes
- [Make a pull request](https://help.github.com/articles/using-pull-requests)
- Ensure CI passes (and if it fails, attempt to address the cause)

### Adding features

In general, feature additions will come from Bugsnag employees. If you think you have
a useful addition that doesn’t take long to create a pull request for, feel free
to go ahead and make it and strike up a discussion. With any non-trivial amount
of work, the best thing to do is [create an issue](https://github.com/bugsnag/bugsnag-js/issues/new)
in which to discuss the feature, for the following reasons:

- Bugsnag has an internal roadmap of things to work on. We might have already planned to
work on your suggested feature.
- We might disagree about whether the addition is worthwhile or not.
- We might agree that the addition is worthwhile but disagree with the implementation.

That said, we have had some tremendous contributions from the community in the past,
so use your best judgement. What we want to avoid here is anybody feeling like they’ve
wasted their time!

## System requirements

In order to develop on the project you’ll need to be on Mac/Linux٭. All you’ll need is:
- [node](https://nodejs.org) `v8+` (which includes [npm](https://www.npmjs.com/get-npm) 5+)
- [git](https://git-scm.com/)

[٭] if you’re on Windows and want to contribute, we’d welcome help making
the development experience cross-platform

## QA

__tl;dr:__ _any changes must come with tests and must lint successfully._

### Testing

#### Unit tests

__Every file in `base` should be 100% covered by unit tests__. These tests can run in Node
(not every browser). This means they are fast. They serve the purpose of validating
that the logic is sound, and that individual components are implemented correctly,
functioning as intended. They do not provide guarantees for any other environments.

__Command__

```
npm run test:unit
```

#### Integration tests

__The entire module (and any publicly-exported subcomponents) should be tested against
all of the environments we support__. Each high-level feature and distinct configuration
should be run. 100% coverage is the aim, but different environments will take different
code paths so coverage reporting is tricky. [Code Climate](https://codeclimate.com/github/bugsnag/bugsnag-js)
aggregates coverage reports from each browser which helps us detect totally uncovered
lines.

__Command__

```
npm run test:integration
npm run test:integration:quick # runs only in headless Chrome for quicker results
```

#### End-to-end tests

__The entire module should be included via all of the supported delivery mechanisms
(`<script>`, `require(…)`, `AMD` etc.) in real environments__. Not every permutation
and configuration option needs to be tested at this level. Too many tests here make
for a brittle suite that will be a maintenance overhead, so we need to strike a balance.

__Command__

```
npm run test:e2e
npm run test:e2e:quick # runs only in headless Chrome for quicker results
```

### Linting

JavaScript source files are written in [standard style](https://standardjs.com).
The TypeScript definition files are linted with [tslint](https://palantir.github.io/tslint/).
You should configure your editor to lint while you code as it's best to catch errors
early.

__Command__

```
npm run lint
```

## Releases

Ensure you have the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment
variables set. Also __ensure 2FA is enabled__ on your AWS account.

Releases are automated as much as possible and abstracted into the following commands…

### Prerelease


```
npm version pre{patch|minor|major}
```

It is usually best to do a prerelease before a full release. The prerelease command
will do the following:

- Increment the version number
- Ensure the unit tests and linter pass
- Update the table of contents `CONTRIBUTING.md`
- Update the size badge in the `README.md`
- Update `version` in `package.json`
- Create the build assets in `dist/`
- Create a version commit (e.g. `4.0.0-3`) and tag (e.g. `v4.0.0-3`)
- Push commits and tags
- Publish to npm with the tag `unstable`
- Upload built assets to the CDN

If you are incrementing on a version that is already prerelease you can just supply `pre`
as the argument which will increment the prerelease component of the version number.

### Release

When you are happy with the prerelease, you can release it with the following command:

```
npm version {patch|minor|major}
```

The release command will do the following:

- Increment the version number
- Ensure the unit tests and linter pass
- Update the table of contents `CONTRIBUTING.md`
- Update the size badge in the `README.md`
- Update `version` in `package.json`
- Prompt for a changelog entry and insert it into `CHANGELOG.md`
- Create the build assets in `dist/`
- Create a version commit (e.g. `4.0.0`) and tag (e.g. `v4.0.0`)
- Push commits and tags
- Publish to npm with the tag `latest`
- Upload built assets to the CDN

This command will launch your into your `$EDITOR` and get you to create a changelog
entry for the release (much like `git commit` does).
Tailor the contents to the specifics of the release you are creating, then save and exit.
The contents of the file you edit will be formatted and inserted into CHANGELOG.md.
