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

The proxy of choice is [verdaccio](https://verdaccio.org/). This is already included as a dev dependency in the bugsnag-js repository, along with a config file at `test/local-npm.config.yml`.

To start the verdaccio server, run the `local-npm:start` npm script from the repo root:

```
npm run local-npm:start
```

This will start verdaccio running on port `5539`. You will need to keep this running for the following steps.

In the project where you want to install the development notifier, create an a `.npmrc` file at the project root alongside `package.json` and set the local registry URL:

```
registry=http://localhost:5539
```

Alternatively you can just supply the `--registry=http://localhost:5539` to each npm/yarn command you issue.

#### Installing the development notifier in a React Native project

1. Make changes.
2. In a new terminal window, from the repo root, run the `local-npm:publish-all` npm script to publish to the local registry:

    ```
    VERSION_IDENTIFIER=8.99.99 npm run local-npm:publish-all
    ```

    This will publish all of the packages in the repo to verdaccio with the specified version.
    
    Note: You'll need to ensure you publish using the same major version as is currently in the repository. This is because some packages declare a peer dependency on `@bugsnag/core`, and lerna does not update peer dependencies when versioning, so changing the major version will mean the packages fail to install (since the peer dependency cannot be resolved from the local registry).

4. Reset the changes that were made to `package.json`, `lerna.json` and `package-lock.json` files with `git reset --hard HEAD` (we don't want to commit these throwaway versions)

In the project where you want to install `@bugsnag/react-native` substitute the version's output from above:

```
yarn add @bugsnag/react-native@8.99.99
# or
npm i @bugsnag/react-native@8.99.99
```
