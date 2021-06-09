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

#### Creating a new test fixture

When each new version of React Native is released, a new test fixture project "shell" should be created.  The inner
workings of the app (that exercise the test scenarios) are then copied in dynamically by the build process.  There are
several steps to follow to create the project shell:

1. Create a new React Native project of the desired version.  E.g:
    ```
    npx react-native init reactnative --directory rn0.64 --version 0.64
    ```
1. Remove the following files/folders, if they exist:
Remove 
- \_\_tests\_\_
- .eslintrc.js
- App.js
- index.js

1. Create a `.dockerignore` file:
    ```
    ./node_modules/
    ./app/
    ```

1. Add the following to `.gitignore`:
    ```
    /app/
    /output/
    /reactnative.xcarchive/
    ```

1. Copy the following files from an existing test fixture directory:
    - build.sh
    - exportOptions.plist

1. Android (using existing test fixtures as a guide):
    1. In build.gradle:
        - add Kotlin
        - add Bugsnag
        - remove mavenLocal
    1. In app/build.gradle:
        - add Kotlin
        - add Bugsnag
        - add NDK `abiFilters "arm64-v8a", "x86"`
    1. In gradle.properties, set org.gradle.jvmargs=-Xmx4096m  
    1. In app/proguard-rules.pro, add:
        ```
        -keep class com.reactnative.** {*;}
        ```
    1.  In app/src/main/AndroidManifest.xml, add:
        ```
        android:usesCleartextTraffic="true"
        ```
    1.  In MainApplication.java, add:
        ```
        import com.reactnative.module.BugsnagModulePackage;
        ```
        and
        ```
        packages.add(new BugsnagModulePackage());
        ```
1. Similarly, on iOS:
    1. Add to `reactnative/Info.plist`:
    ```
    <key>NSAllowsArbitraryLoads</key>
    <true/>
    ```
    and
    ```
    <key>bs-local.com</key>
    <dict>
        <key>NSExceptionAllowsInsecureHTTPLoads</key>
        <true/>
    </dict>
    ```

1. Open `ios/reactnative.xcworkspace` in Xcode
    1. Add a new Group called `Scenarios` beneath `reactnative/reactnative`
    1. Add all files in `../../ios-modules/Scenarios` to the new group
    1. Xcode may promt to add a bridging header for Swift.  Cancel this and instead:
    1. Set Build Settings -> Swift Compiler - General -> Objective-C Bridging Header to `../../ios-module/Scenarios/Scenario.h`
