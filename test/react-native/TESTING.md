### React-native testing

The React-native tests drive real, remote mobile devices using BitBar in CI, or BrowserStack when run locally. As a Bugsnag employee you can access the
necessary credentials in our shared password manager.

The test fixture (a React Native app) that tests are run against needs to be built with a published version of
@bugsnag/react-native.  By default, the build process will base this on the current branch/comment,
e.g. `7.5.2-my-branch.e8cbdad2f4`, which needs to be published first if building locally.  For example, if using
[Verdaccio](https://verdaccio.org/docs/en/docker.html):

```shell script
node ./scripts/publish.js http://localhost:5539
```

This can also be overridden using the environment variable `NOTIFIER_VERSION`, which is useful during development when
making test, but not notifier, changes.

If building against the current branch/commit, the packages must be published to a locally owned NPM repository
(! Not the official NPMJS repository !). This can be locally or remotely hosted, but should be versioned appropriately.

#### Generating a dynamic test fixture (React Native >=0.71)

For React Native 0.71 onwards, test fixtures are generated dynamically.
From the root directory run `node ./scripts/generate-react-native-fixture.js`, specifying the following environment variables:

- `RN_VERSION`
- `REGISTRY_URL`
- `NOTIFIER_VERSION`
- `RCT_NEW_ARCH_ENABLED` - 1 (new architecture) or 0 (old architecture)
- `REACT_NATIVE_NAVIGATION` (optional) - set to 1 to build a react-native-navigation test fixture
- `BUILD_ANDROID` (optional) - set to 1 to build an Android APK
- `BUILD_IOS` (optional) - set to 1 to build an iOS ipa

This will generate a React Native project using the React Native CLI and install the notifier, scenarios and any other required dependencies.
The generated project can be found in `test/react-native/features/fixtures/generated/<old-arch | new-arch><RN_VERSION>`

#### Scenarios

Scenarios are are packaged as a separate module under `test/react-native/features/fixtures/scenario-launcher` - these are packaged and installed into the test fixture when it's generated.

Scenarios are driven via maze runner commands (see `react-native-steps.rb`). However it is also possible to run a scenario locally for debugging purposes by hardcoding a command in ScenarioLauncher.js

#### Building the legacy test fixtures (React Native < 0.71)

For older React Native versions, static test fixtures can be found under `features/fixtures`.

In CI, these are built using Docker. Three bits of information will need to be passed into the test run as environment variables in order to
access this package:
- `REG_BASIC_CREDENTIAL`: the basic auth credentials of an account able to access the repository
- `REG_NPM_EMAIL`: the email of the user accessing the repository
- `REGISTRY_URL`: the remote address of the repository

The targeted release of `@bugsnag/react-native` must be tagged with the short hash of the current commit in order to be
picked up by the gradle build process.

When building locally, use the appropriate npm scripts as documented below.

Remember to set the following variables:
- `REACT_NATIVE_VERSION`
- `REGISTRY_URL`
- `NOTIFIER_VERSION` (optionally)

There are several react-native versions that can be targeted and the `REACT_NATIVE_VERSION` environment variable should
be set accordingly:

| React native fixture | `REACT_NATIVE_VERSION` |
|----------------------|------------------------|
| 0.66                 | `rn0.66`               |
| 0.69                 | `rn0.69`               |

For iOS:
```shell script
npm run test:build-react-native-ios
```

Fnd Android:
```shell script
npm run test:build-react-native-android
```
These will build a `.ipa` or `.apk` file respectively and copy into `./build`.

#### Running the end-to-end tests locally

Ensure that the following environment variables are set:
- `BROWSER_STACK_USERNAME` - Your BrowserStack App Automate Username
- `BROWSER_STACK_ACCESS_KEY` - Your BrowserStack App Automate Access Key
- `MAZE_BS_LOCAL` - Location of the BrowserStack local testing binary

See https://www.browserstack.com/local-testing/app-automate for details of the required local testing binary. In
particular, these commands need the `BrowserStackLocal` binary (available
[here](https://www.browserstack.com/local-testing/releases) to reside in your home directory.

1. Change into the `test/react-native` directory
1. Check the contents of `Gemfile` to select the version of `maze-runner` to use.
1. To run a single feature on an Android device (as an example):
    ```shell script
    bundle exec maze-runner --app=<PATH_TO_TEST_FIXTURE_APK> \
                            --farm=bs \
                            --device=ANDROID_9_0 \
                            features/app.feature
    ```
1. Or on iOS:
    ```shell script
    bundle exec maze-runner --app=<PATH_TO_TEST_FIXTURE_IPA> \
                            --farm=bs \
                            --device=IOS_15 \
                            features/app.feature
    ```
1. To run all features, omit the final argument.
1. Maze Runner also supports all options that Cucumber does.  Run `bundle exec maze-runner --help` for full details.

## CI test matrix

End-to-end tests in CI run on both Android and iOS, for both old and new architecture (where supported), across a range of React Native versions. When a new version of React Native is released, the CI test matrix should be updated to test against the following React Native versions:

- The latest 3 versions of React Native
- Even versions of React Native going back to 0.72
