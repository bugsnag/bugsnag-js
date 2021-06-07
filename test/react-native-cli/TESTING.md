### React-native CLI testing

The react-native CLI come in three parts:

- CLI tests, that don't require any remote connections or special setup
- Testing an app build, which requires your local machine to be set up for building iOS and Android applications
- Testing the built app, which requires the built application from the previous test set to run

#### CLI tests

The CLI tests target the command line interface by providing a set of responses to expected queries, verifying that the CLI tool responds correctly and makes appropriate changes to the workspace.

##### Setting up

1. Run through the initial setup
1. Run `npm pack packages/react-native-cli/` to pack the react-native-cli package
1. Copy the resulting package, `bugsnag-react-native-cli-{VERSION}.tgz` into the target fixture, e.g.:
    ```shell script
    cp bugsnag-react-native-cli-*.tgz test/react-native-cli/features/fixtures/rn0_60/
    ```

##### Running

1. Change directory into `test/react-native-cli`
1. Check the contents of `Gemfile` to select the version of `maze-runner` to use
1. Install maze-runner with `bundle install`
1. Run the full set of cli tests targeting a specific react-native version (`rn0_61` for example):
  ```shell script
  REACT_NATIVE_VERSION=rn0_61 bundle exec maze-runner features/cli-tests
  ```

#### Build tests

The build tests come in two flavours, Android and iOS, and are required to run the subsequent tests using the resulting `.apk` and `.ipa` artefacts.  These tests ensure that the app can be built after Bugsnag is installed, and subsequent build messages are sent and contain the appropriate information.

##### Setup

1. Change directory into `test/react-native-cli`
1. Check the contents of `Gemfile` to select the version of `maze-runner` to use
1. Install maze-runner with `bundle install`

##### Running the Android variant

- Run maze-runner targeting the specific Android build feature for a specific react-native version (`rn0_61` for example):
  ```shell script
  REACT_NATIVE_VERSION=rn0_61 bundle exec maze-runner features/build-app-tests/build-android-app.feature
  ```

##### Running the iOS variant (MacOS only)

- Run the script to trigger the build for the specific react-native version (`rn0_62` for example):
  ```shell script
  ./scripts/init-and-build-test.sh rn0_62
  ```

#### App tests

These tests ensure that Bugsnag has successfully been installed by the CLI, and errors and sessions are correctly reported.

##### Setup

Before running these tests the previous tests, `Build Tests` must be run for the test fixtures to be present.

1. Change directory into `test/react-native-cli`
1. Check the contents of `Gemfile` to select the version of `maze-runner` to use
1. Install maze-runner with `bundle install`

##### Running

Ensure that the following environment variables are set:
- `MAZE_DEVICE_FARM_USERNAME` - Your BrowserStack App Automate Username
- `MAZE_DEVICE_FARM_ACCESS_KEY` - Your BrowserStack App Automate Access Key
- `MAZE_BS_LOCAL` - Location of the BrowserStack local testing binary

See https://www.browserstack.com/local-testing/app-automate for details of the required local testing binary. In
particular, these commands need the `BrowserStackLocal` binary (available 
[here](https://www.browserstack.com/local-testing/releases) to reside in your home directory.

1. To run on an Android device (`rn0_63` for example):
    ```shell script
    bundle exec maze-runner --app=./build/rn0_63.apk \
                            --farm=bs \
                            --device=ANDROID_9_0 \
                            --a11y-locator \
                            --bs-local=~/BrowserStackLocal \
                            features/run-app-tests
    ```
1. Or on iOS:
    ```shell script
    bundle exec maze-runner --app=../../build/rn0_63.ipa \
                            --farm=bs \
                            --device=IOS_13 \
                            --a11y-locator \
                            --bs-local=~/BrowserStackLocal \
                            features/run-app-tests
    ```
