# BugsnagReactNative contributing guide

`BugsnagReactNative.xcodeproj` is a convenience, and not used during the build.

It can be used to quickly verify that the `BugsnagReactNative` sources build against the latest bugsnag-cocoa release.

It relies on `React.xcodeproj` which was removed in React Native 0.60, so to be able to build the Xcode project you must install React Native 0.59 from within the parent (`react-native`) directory;

```
npm install react-native@0.59
```
