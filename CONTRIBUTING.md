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

A full guide to testing can be found in the [testing](./TESTING.md) document

## CI

CI runs on Buildkite. Tests are run automatically on any branch from within this repo. PRs from external repos do not run on the private test infrastructure. Once an external PR has been reviewed by a Bugsnag employee, a branch can be created within this repo in order to run on CI.

⚠️ __Caution__: exercise due-diligence before creating a branch based on an external contribution – for example, be sure not to merge a bitcoin miner disguised as a bug fix!

## Releases

Before creating any release:

- run `npm install` in the root of the project and `npm run bootstrap` to ensure the top-level node_modules and leaf node_modules are all correct for the branch you have checked out.
- ensure you are logged in to npm and that you have access to publish to the following on npm
  - any packages in the `@bugsnag` namespace
  - the `bugsnag-expo-cli` package
- ensure you have an AWS key pair with access to our S3 bucket and cloudfront distribution. Export these in your environment as `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (if you're going to publish to the CDN)

To start a release:

- decide on a version number
- create a new release branch from `next` with the version number in the branch name
`git checkout -b release/vX.Y.Z`
- update the version number and date in the changelog
- make a PR from your release branch to `master` entitled `Release vX.Y.Z`
- get the release PR reviewed – all code changes should have been reviewed already, this should be a review of the integration of all changes to be shipped and the changelog
- consider shipping a [prerelease](#prereleases) to aid testing the release

Once the release PR has been approved:

- merge the PR into master
- `git checkout master` and `git pull`

You are now ready to make the release:

```
lerna version [major | minor | patch]
lerna publish from-git
```

<small>Note: if a prerelease was made, to graduate it into a normal release you will want to use `patch` as the version.</small>

At this point it is sensible to perform some manual smoke tests to ensure the new version on npm works as expected. Only then publish to the CDN:

```
lerna run cdn-upload
```

Finally:

- create a release on GitHub https://github.com/bugsnag/bugsnag-js/releases/new
- use the tag vX.Y.Z as the name of the release
- copy the release notes from `CHANGELOG.md`
- publish the release

### Prereleases

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
lerna publish from-git --dist-tag next
```

The `--dist-tag next` part ensures that it is not installed by unsuspecting users who do not specify a version – npm automatically adds the `latest` tag to a published module unless one is specified.

If you want to publish the release to the CDN, use the following command:

```
lerna run cdn-upload
```
