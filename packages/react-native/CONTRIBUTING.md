# @bugsnag/react-native contributing guide

## Upgrading native notifier dependencies

Both [`bugsnag-android`](https://github.com/bugsnag/bugsnag-android) and [`bugsnag-cocoa`](https://github.com/bugsnag/bugsnag-cocoa) are vendored into this repository as part of the `@bugsnag/react-native` package. When updates to those notifiers are released, a PR should be make to this repository to vendor the new version.

### Android

[bugsnag-android](https://github.com/bugsnag/bugsnag-android) AAR artefacts are located in `packages/react-native/android/com/bugsnag`

To update the version of the bundled artefacts:

- Run the script `packages/react-native/update-android.sh`. This script accepts version tags, sha, or a local directory, but for releases specify a version (e.g. `packages/react-native/update-android.sh --version 5.2.2`).
- To install the new artifacts locally (for local testing only), run `packages/react-native/prepare-android-vendor.sh`.
- Update the changelog according to the [contributing guide](../../CONTRIBUTING.md), creating a new `TBD` section if one doesn't exist. Under the section `### Changed` add a new entry: `- (react-native): Update bugsnag-android to v{VERSION}`, indenting one level and including the entire changelog for the version that has been updated. If multiple releases have been made since the version bump, the changelog entries for the interim should be aggregated into one.

#### iOS

[bugsnag-cocoa](https://github.com/bugsnag/bugsnag-cocoa) source is vendored in `packages/react-native/ios/vendor/bugsnag-cocoa`.

To update the version of the bundled notifier source:

- Run the script `packages/react-native/update-ios.sh`. This script accepts version tags, sha, or a local directory, but for releases specify a version (e.g. `packages/react-native/update-ios.sh --version 6.6.2`). This will copy the Cocoa sources and headers into the correct locations.
- Update the changelog according to the [contributing guide](../../CONTRIBUTING.md), creating a new `TBD` section if one doesn't exist. Under the section `### Changed` add a new entry: `- (react-native): Update bugsnag-cocoa to v{VERSION}`, indenting one level and including the entire changelog for the version that has been updated. If multiple releases have been made since the version bump, the changelog entries for the interim should be aggregated into one.

## Development

### Installing the development notifier in a React Native app

#### Problem

To install a single development npm package, you can simply use `npm pack` to create the tarball that would be added to the registry.

Since the React Native notifier is larger that a single package – for the purpose of this discussion it's a directed graph of dependencies in this monorepo – you can't do that. You can pack the `@bugsnag/react-native` package, but any unpublished changes to any other local package in the monorepo will not be included. If you have added a new package which does not exist on the registry yet it will also not include that.

To solve this problem we publish to a local npm clone, which proxies requests for unknown modules onto the public registry. This means we can push local working copies to it, and consume them as if they were on the public registry.

#### Prerequisites

The proxy of choice is [verdaccio](https://verdaccio.org/):

```sh
# install it globally on your system
npm i -g verdaccio

# starts the  on the default port
verdaccio

# log in to the registry
# (you can enter anything, just be sure to remember them when
# your session times out and you need to "sign in" again)
npm adduser --registry http://localhost:4873
```

On the project you want to install the development notifier, create an a `.npmrc` file at the project root alongside `package.json`:

```
registry=http://localhost:4873
```

Alternatively you can just supply the `--registry=http://localhost:4873` to each npm/yarn command you issue.

#### Installing the development notifier on a React Native project

1. Make changes.
2. Run the following command to publish to the local registry:

    ```
    npx lerna publish v99.99.99-canary.`git rev-parse HEAD` --no-push --exact --no-git-tag-version --registry http://localhost:4873/
    ```

    This should prompt you for each module that has changed since the last proper publish.

4. Reset the changes that were made to `lerna.json` and `package-lock.json`s `git reset --hard HEAD` (we don't want to store these throwaway versions)

On the project you want to install `@bugsnag/react-native` substitute the version's output from above:

```
yarn add @bugsnag/react-native@99.99.99-canary.<hash>
# or
npm i @bugsnag/react-native@99.99.99-canary.<hash>
```
