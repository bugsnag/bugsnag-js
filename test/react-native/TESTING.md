### React-native testing

The React-native tests drive real, remote mobile devices using BrowserStack. As a Bugsnag employee you can access the 
necessary credentials in our shared password manager.

The test fixture (a React Native app) that tests are run against needs to be built with a published version of 
@bugsnag/react-native.  By default, the build process will base this on the current branch/comment, 
e.g. `7.5.2-my-branch.e8cbdad2f4`, which needs to be published first if building locally.  For example, if using 
[Verdaccio](https://verdaccio.org/docs/en/docker.html):
```
node ./scripts/publish.js http://localhost:4873
```

This can also be overridden using the environment variable `NOTIFIER_VERSION`, which is useful during development when 
making test, but not notifier, changes.

If building against the current branch/commit, the packages must be published to a locally owned NPM repository 
(! Not the official NPMJS repository !). This can be locally or remotely hosted, but should be versioned appropriately.  

Three bits of information will need to be passed into the test run as environment variables in order to 
access this package:
- `REG_BASIC_CREDENTIAL`: the basic auth credentials of an account able to access the repository
- `REG_NPM_EMAIL`: the email of the user accessing the repository
- `REGISTRY_URL`: the remote address of the repository

The targeted release of `@bugsnag/react-native` must be tagged with the short hash of the current commit in order to be 
picked up by the gradle build process.

There are several react-native versions that can be targeted and the `REACT_NATIVE_VERSION` environment variable should 
be set accordingly:

| React native fixture | `REACT_NATIVE_VERSION` |
|----------------------|------------------------|
| 0.60                 | `rn0.60`               |
| 0.63                 | `rn0.63`               |

#### Building the test fixture

Remember to set the following variables:
- `REACT_NATIVE_VERSION`
- `REGISTRY_URL`
- `NOTIFIER_VERSION` (optionally)

For iOS:
```shell script
npm run test:build-react-native-ios
```

Fnd Android:
```shell script
npm run test:build-react-native-android
```
These will build a `.ipa` or `.apk` file respectively and copy into `./build`.

#### Running the end-to-end tests

Ensure that the following environment variables are set:
- `MAZE_DEVICE_FARM_USERNAME` - Your BrowserStack App Automate Username
- `MAZE_DEVICE_FARM_ACCESS_KEY` - Your BrowserStack App Automate Access Key
- `MAZE_BS_LOCAL` - Location of the BrowserStack local testing binary

See https://www.browserstack.com/local-testing/app-automate for details of the required local testing binary. In
particular, these commands need the `BrowserStackLocal` binary (available 
[here](https://www.browserstack.com/local-testing/releases) to reside in your home directory.  

1. Change into the `test/react-native` directory
1. Check the contents of `Gemfile` to select the version of `maze-runner` to use.
1. To run a single feature on an Android device (as an example):
    ```shell script
    bundle exec maze-runner --app=../../build/${REACT_NATIVE_VERSION}.apk \
                            --farm=bs \
                            --device=ANDROID_9_0 \
                            --a11y-locator \
                            features/app.feature
    ```
1. Or on iOS:
    ```shell script
    bundle exec maze-runner --app=../../build/${REACT_NATIVE_VERSION}.ipa \
                            --farm=bs \
                            --device=IOS_13 \
                            --appium-version=1.18.0 \
                            --a11y-locator \
                            features/app.feature
    ```
1. To run all features, omit the final argument.
1. Maze Runner also supports all options that Cucumber does.  Run `bundle exec maze-runner --help` for full details.
