# React Native upgrade guide

## `bugsnag-react-native@*` to `@bugsnag/react-native@7.3`

As of `v7.3` of the [`bugsnag-js` monorepo](https://github.com/bugsnag/bugsnag-js) it contains Bugsnag's SDK for React Native. This additional notifier joins `@bugsnag/js` and `@bugsnag/expo` in its unified version scheme, so the first version of `@bugsnag/react-native` is `v7.3.0`.

The previous React Native SDK – [`bugsnag-react-native`](https://github.com/bugsnag/bugsnag-react-native) – continues to be available and will receive critical bug fixes, but it is no longer under active development and won't receive new features.

`@bugsnag/react-native` is a complete rewrite and has no backwards compatibility with `bugsnag-react-native`. Therefore, the upgrade steps essentially consist of these three steps:

1. removing `bugsnag-react-native` and (its dependencies) from your project
2. adding `@bugsnag/react-native` to your project
3. updating any usage of Bugsnag throughout your codebase

The oldest version of React Native supported by `@bugsnag/react-native@7.3` is `0.60`. If your project is running an older version than this, you should upgrade that first, or continue to use `bugsnag-react-native` until such time as you can upgrade.

## Removing `bugsnag-react-native`

Since `@bugsnag/react-native` is an entirely new module, `bugsnag-react-native` should be removed first. It's not possible to run them both alongside one-another, so the replacement can't be done incrementally.

Firstly, remove the npm package with `npm` or `yarn`:

```sh
npm rm bugsnag-react-native
# or
yarn remove bugsnag-react-native
```

This will remove Bugsnag from your `package.json`, `package-lock.json`/`yarn.lock` and from `node_modules`. On the iOS side of your project you need to re-run `pod install` for it to remove anything Bugsnag-related from the pods in your workspace.

```sh
cd ios
pod install
```

At this point it would be sensible to clean your projects so that no intermediate build assets are left around.

For iOS, open up the project in XCode `open ios/<ProjectName>.xcworkspace`, and from the menubar select `Product > Clean build folder`.

For Android, run `cd android && ./gradlew clean`.

## Adding `@bugsnag/react-native`

Full instructions are available at the [React Native integration guide](https://docs.bugsnag.com/platforms/react-native/react-native#installation) but here is a summary.

Install the new package from npm using your preferred command:

```sh
npm install --save @bugsnag/react-native
# or
yarn add @bugsnag/react-native
```

### Android

Add the following to your `android/app/build.gradle` to integrate Bugsnag into your Anroid project:

```groovy
apply from: "../../node_modules/@bugsnag/react-native/bugsnag-react-native.gradle"
```

### iOS

Run cocoapods again so that it picks up the new local dependency:

```
cd ios
pod install
```

## Updating usage

Full integration instructions are available on the [React Native integration guide](https://docs.bugsnag.com/platforms/react-native/react-native#installation). This section will focus on specific areas that have changed.

Since this update involved a major bump to Bugsnag's JS, Android and iOS notifiers, including lots of breaking changes to bring all of their APIs in sync, any usage of Bugsnag's API in your application will need updating.

### Initialization

Previously in `bugsnag-react-native` it was possible to initialize in a variety of ways. Now there is one way to do it.

In each of your native projects you need to initialize Bugsnag. This was optional before, but it means that now crashes before the JS layer loads will always be caught.

To facilitate this, and to get Bugsnag started as early as possible, most configuration can only be done in the iOS and Android projects. Some JS-specific options are allowed in the JS layer.

#### iOS

Update any of the following imports in. These will likely be in `AppDelegate.m` where it's recommended to configure Bugsnag, but may be in other locations too:

```diff
- #import <BugsnagReactNative/BugsnagReactNative.h>
- #import "BugsnagConfiguration.h"
+ #import <Bugsnag/Bugsnag.h>
```

Inside your `application:didFinishLaunchingWithOptions` method, replace any Bugsnag initialization code with the updated version:

```diff
- [BugsnagReactNative start];
+ [Bugsnag start];
```

If you have set your API key in `Info.plist`, the format has changed from a top level string to a dictionary. You can now provide many other configuration options in the plist too:

```diff
- <key>BugsnagAPIKey</key>
- <string>YOUR_API_KEY</string>
+ <key>bugsnag</key>
+ <dict>
+     <key>apiKey</key>
+     <string>YOUR_API_KEY</string>
+ </dict>
```

If you want or need to customize your configuration in code:

```diff
- BugsnagConfiguration *config = [BugsnagConfiguration new];
- config.releaseStage = @"beta";
- [BugsnagReactNative startWithConfiguration:config];
+ BugsnagConfiguration *config = [BugsnagConfiguration loadConfig];
+ config.releaseStage = @"beta";
+ [Bugsnag startWithConfiguration:config];
```

See the new [Bugsnag Cocoa configuration guide](https://docs.bugsnag.com/platforms/ios/configuration-options/) for all available configuration options.

#### Android

Replace the following import which will likely be in your `MainApplication.java` file:

```diff
- import com.bugsnag.android.BugsnagReactNative;
+ import com.bugsnag.android.Bugsnag;
```

Inside your application's `onCreate` method, replace any Bugsnag initialization code with the updated version:

```diff
- BugsnagReactNative.start(this /* app context */);
+ Bugsnag.start(this /* app context */);
```

Along with your API key in `android-manifest.xml` you can now provide many other configuration options.

Alternatively you can still configure in code:

```diff
- Configuration config = new Configuration();
- config.setReleaseStage("beta");
- BugsnagReactNative.startWithConfiguration(this /* app context */, config);
+ Configuration config = Configuration.load(this);
+ config.setReleaseStage("beta");
+ Bugsnag.start(this /* app context */, config);
```

#### JS

As part of the `bugsnag-js monorepo`, the JS interface now looks the same as our JS notifier, and uses the same names and concepts as our other platforms.

When the JS layer loads, __the native iOS/Android Bugsnag client must already have been configured__. If you attempt to initialize the JS layer without having first configured the native layer, it __will not work__. This is new behavior – previously we allowed configuration of the native layer to be done lazily and automatically, but this meant native errors on startup could be missed.

```diff
- import { Client } from 'bugsnag-react-native';
- const client = new Client();
+ import Bugsnag from '@bugsnag/react-native'
+ Bugsnag.start()
```

Since the JS layer hooks in to an already running native layer, there are fewer configuration options available. Most configuration must be done in the native layer, with only a small subset of JS-specific options allowed in the JS layer.

JS configuration options are now supplied directly to the `start` method:

```diff
- import { Configuration } from 'bugsnag-react-native'
- const config = new Configuration()
- config.codeBundleId = '1.2.3-r091283'
- const client = new Client(config)
+ Bugsnag.start({
+   codeBundleId: '1.2.3-r091283'
+ })
```

See the [React Native configuration options page](https://docs.bugsnag.com/platforms/react-native/react-native/configuration-options) for reference.

### General usage

#### iOS

Bugsnag React Native vendors the `bugsnag-cocoa` library, so the usage is the same whether you are using `bugsnag-cocoa` directly, or whether you are using Bugsnag in the iOS side of your React Native project.

See the [V5 to V6 section of the `bugsnag-cococa` upgrade guide](https://github.com/bugsnag/bugsnag-cocoa/blob/master/UPGRADING.md#upgrade-from-5x-to-6x) for examples of how to update the usage of Bugsnag's APIs.

#### Android

Bugsnag React Native vendors the `bugsnag-android` library, so the usage is the same whether you are using `bugsnag-android` directly, or whether you are using Bugsnag in the Android side of your React Native project.

See the [V4 to V5 section of the `bugsnag-android` upgrade guide](https://github.com/bugsnag/bugsnag-android/blob/master/UPGRADING.md#upgrade-from-4x-to-5x) for examples of how to update the usage of Bugsnag's APIs.

#### JS

Previously initialization of Bugsnag would return a `Client` that you would need to hold a reference to and pass around your application. You can still do that if you want, but importing `Bugsnag` is a static namespace that you can import and use anywhere, provided `Bugsnag.start()` has been called somewhere first.

```diff
- const client = new Client()
+ Bugsnag.start()
```

##### Handled errors

To report a handled error call the `notify()` method:

```diff
- client.notify(new Error('uh oh'))
+ Bugsnag.notify(new Error('uh oh'))
```

The second argument is an `onError` callback which will receive the error report that will be sent to Bugsnag. This is similar to the previous interface, but previously the data structure was a `report` – now it is an `event`. See the [Customizing error reports](https://docs.bugsnag.com/platforms/react-native/react-native/customizing-error-reports/#updating-events-using-callbacks) for full information. An example of adding metadata to an event is shown below:

```diff
- client.notify(err, (report, originalError) => {
+ Bugsnag.notify(err, event => {
-   report.metadata = {
-     account: { id: '123', name: 'Acme Co' }
-   }
+   event.addMetadata('account', { id: '123', name: 'Acme Co' })

    // Note, originalError error now exists at event.originalError
  })
```

##### Adding/removing callbacks

```diff
- configuration.registerBeforeSendCallback(fn)
- configuration.unregisterBeforeSendCallback(fn)
+ Bugsnag.start({ onError: fn })
  // or
+ Bugsnag.addOnError(fn)
+ Bugsnag.removeOnError(fn)
```

See the [callbacks](https://docs.bugsnag.com/platforms/react-native/react-native/customizing-error-reports/#updating-events-using-callbacks) section of the docs.

##### Adding user information

```diff
- client.setUser('1234', 'Jessica Jones', 'jess@example.com')
+ Bugsnag.setUser('1234', 'jess@example.com', 'Jessica Jones')
```

__Note: the argument order has changed__ from `id,name,email` to `id,email,name`

See the [adding user data](https://docs.bugsnag.com/platforms/react-native/react-native/customizing-error-reports/#adding-user-data) section of the docs.

##### Sessions

```diff
- client.startSession()
- client.pauseSession()
- client.resumeSession()
+ Bugsnag.startSession()
+ Bugsnag.pauseSession()
+ Bugsnag.resumeSession()
```

See the [`startSession`](https://docs.bugsnag.com/platforms/react-native/react-native/capturing-sessions/#startsession), [`pauseSession`](https://docs.bugsnag.com/platforms/react-native/react-native/capturing-sessions/#pausesession) and [`resumeSession`](https://docs.bugsnag.com/platforms/react-native/react-native/capturing-sessions/#resumesession) docs.

##### Configuring endpoints

```diff
- config.setEndpoints(notify, session)
```

This must now be done in native configuration. See the [`endpoints` configuration option](https://docs.bugsnag.com/platforms/react-native/react-native/configuration-options/#endpoints).

##### Enabling/disabling different error types

```diff
- config.autoNotify = false
- config.handlePromiseRejections = false
```

This must now be done in native configuration. See the [`enabledErrorTypes`](https://docs.bugsnag.com/platforms/react-native/react-native/configuration-options/#enablederrortypes) and [`autoDetectErrors`](https://docs.bugsnag.com/platforms/react-native/react-native/configuration-options/#autodetecterrors)  configuration options.

##### Enabling/disabling different breadcrumb types

```diff
- config.consoleBreadcrumbsEnabled = false
- config.automaticallyCollectBreadcrumbs = false
```

This must now be done in native configuration. See the [`enabledBreadcrumbTypes` configuration option](https://docs.bugsnag.com/platforms/react-native/react-native/configuration-options/#enabledbreadcrumbtypes).
