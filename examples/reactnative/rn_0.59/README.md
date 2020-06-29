# React Native

This is an example project showing how to use `@bugsnag/js` with a React Native v0.59 project.

This project was bootstrapped with [`react-native-init`](https://www.npmjs.com/package/react-native-init).

## Usage

1. Clone the repo and `cd` into the directory of this example:
    ```
    git clone git@github.com:bugsnag/bugsnag-js.git
    cd bugsnag-js/examples/reactnative/rn_0.59
    npm install
    ```

1. [Create a bugsnag account](https://app.bugsnag.com/user/new) and create a react native project.

1. Add your project api key to [android/app/src/main/AndroidManifest.xml](android/app/src/main/AndroidManifest.xml#L30-L31):

   ```xml
      <meta-data android:name="com.bugsnag.android.API_KEY"
                 android:value="YOUR-API-KEY-HERE" />
   ```

   and [ios/BugsnagReactNativeExample/Info.plist](ios/BugsnagReactNativeExample/Info.plist#L4-L5):

   ```xml
    <key>BugsnagAPIKey</key>
    <string>YOUR-API-KEY-HERE</string>
   ```

    The API key can be found in the Bugsnag settings for your project.

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
