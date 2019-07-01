# @bugsnag/react-native: contributing guide

This is a WIP.

## Installing the development notifier in a React Native app

### Problem

To install a single development npm package, you can simply use `npm pack` to create the tarball that would be added to the registry.

Since the React Native notifier is larger that a single package – for the purpose of this discussion it's a directed graph of dependencies in this monorepo – you can't do that. You can pack the `@bugsnag/react-native` package, but any unpublished changes to any other local package in the monorepo will not be included. If you have added a new package which does not exist on the registry yet it will also not include that.

To solve this problem we publish to a local npm proxy which can forward on install requests to npm.

### Prerequisites

The proxy of choice is [verdaccio](https://verdaccio.org/):

```sh
# install it
npm i -g verdaccio

# starts verdaccio on the default port
verdaccio

# log in to the registry
# (you can enter nonsense credentials – it will accept anything)
npm adduser --registry http://localhost:4873
```

On the project you want to install the development, an a `.npmrc` file at the project root:

```
registry=http://localhost:4873
```

### Workflow

1. Make changes.
2. Commit your changes (you can't publish changes with a dirty working tree).
  _N.B. if you are making a lot of changes you can `git commit --amend` to prevent a noisy commit trail._
3. Run the following command to publish to the local registry:

    ```
    lerna publish v99.99.99-canary.`git rev-parse HEAD` --no-push --no-git-tag-version --registry http://localhost:4873/
    ```

    This should prompt you for each module that has changed since the last proper publish.

4. Reset the changes that were made to `lerna.json` (we don't want to store these throwaway versions) `git checkout lerna.json`

On the project you want to install `@bugsnag/react-native` substitute the version's has output from above:

```
yarn add @bugsnag/react-native@99.99.99-canary.<hash>
# or
npm i @bugsnag/react-native@99.99.99-canary.<hash>
```
