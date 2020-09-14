# React Native

This is an example project showing how to use `@bugsnag/react-native` with a React Native v0.63 project.

This project was bootstrapped with `react-native init`.

For instructions on how to install and configure Bugsnag in your own application please consult our React Native [documentation](https://docs.bugsnag.com/platforms/react-native/react-native/). 



## Usage

1. Clone the repo and `cd` into the directory of this example:
    ```
    git clone git@github.com:bugsnag/bugsnag-js.git
    cd bugsnag-js/examples/reactnative/rn063example
    npm install
    ```

1. [Create a bugsnag account](https://app.bugsnag.com/user/new) and create a react native project.

1. Add your project api key to [android/app/src/main/AndroidManifest.xml](android/app/src/main/AndroidManifest.xml#L25-L26):

   ```xml
      <meta-data android:name="com.bugsnag.android.API_KEY"
                 android:value="YOUR-API-KEY-HERE" />
   ```

   and [ios/rn063example/Info.plist](ios/rn063example/Info.plist#L4-L5):

   ```xml
    <key>BugsnagAPIKey</key>
    <string>YOUR-API-KEY-HERE</string>
   ```

    The API key can be found in the Bugsnag settings for your project.

1. For iOS only, install the project dependencies from the `ios/` directory using: 

```
pod install 
```

1. Run the app on either Android or iOS:

```
react-native run-ios
react-native run-android
```

Please note that in development mode, unhandled JS errors will not be reported to Bugsnag. You can run in release mode to test this:

```
react-native run-ios --configuration Release
react-native run-android --variant=release
```

To show full stack traces for this example please see the [documentation](https://docs.bugsnag.com/platforms/react-native/react-native/showing-full-stacktraces/).
