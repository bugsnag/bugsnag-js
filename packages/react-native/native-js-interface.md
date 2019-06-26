# Native/JS interface

This is a working spec of the interface that the native layer of `@bugsnag/react-native` exposes to JavaScript.

## Intro

`BugsnagReactNative` is a class which will be instantiated once for the entire runtime and accessible via JS. It's responsible for managing the communicating with the native client (either `bugsnag-android` or `bugsnag-cocoa`) and providing data and invocations from JS to the native client. The React Native runtime is responsible for instantiating this singleton class.

## Accessing `BugsnagReactNative` from JavaScript

Access is set up in the standard React Native way<sup>[1](https://facebook.github.io/react-native/docs/0.59/native-modules-ios),[2](https://facebook.github.io/react-native/docs/0.59/native-modules-android)</sup> such that `BugsnagReactNative` is available in JavaScript like so:

```js
const { NativeModules } = require('react-native')
const { BugsnagReactNative } = NativeModules
```

## API

### Methods

#### `BugsnagReactNative.getConfig(): configMap`

Retrieves a data structure representing the configuration which the native client was initialised with. The data structure needn't be immutable since it will be passed over the bridge anyway, but mutations should not have any effect.

A return value of `null` will indicate to the JS layer that the native client is not configured. The JS notifier can do something sensible with this information, like throw an error or log a warning.

This method is required to be synchronous so it should be annotated as such. This is because during its synchronous configuration, the JS layer needs to obtain config from the native layer.

###### Android

```java
@ReactMethod(isBlockingSynchronousMethod = true)
public ReadableMap getConfig()
```

###### iOS
```objc
(NSDictionary *)getConfig;

// annotation goes in BugsnagReactNative.m
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(getConfig);
```

#### `BugsnagReactNative.updateMetaData(update): void`

Updates to `metaData` in JS should be replicated and stored in the native layer using this method.

###### Android
```java
void updateMetaData(ReadableMap update)
```

###### iOS
```objc
- (void)updateMetaData:(NSDictionary *)update;
```

#### `BugsnagReactNative.updateContext(update): void`

Updates to `context` in JS should be replicated and stored in the native layer using this method.

###### Android
```java
void updateContext(String update)
```

###### iOS
```objc
- (void)updateContext:(NSString *)update;
```

#### `BugsnagReactNative.updateUser(user): void`

Updates to `user` in JS should be replicated and stored in the native layer using this method.

###### Android
```java
void updateUser(String id, String name, String email)
```

###### iOS
```objc
- (void)updateUser:(NSString *)id
                  :withName(NSstring *)name
                  :withEmail(NSstring *)email;
```

#### `BugsnagReactNative.dispatch(report): Promise<boolean>`

Pass a report that was created in JS-land to the native layer for delivery. The boolean return value denotes the following:

- `true`: the report was sent, or was enqueued with the intention of sending later
- `false`: the report was not sent and will never be sent

The `report` contains this subset of the error reporting payload structure:

| Key                        | Type                  |
|----------------------------|-----------------------|
| `exceptions`               | `Array[Exception]`    |
| `severity`                 | `String`              |
| `unhandled`                | `boolean`             |
| `app`                      | `Map<String, any>`    |
| `device`                   | `Map<String, any>`    |
| `breadcrumbs`              | `Array<Breadcrumb>`   |
| `context`                  | `String`              |
| `user`                     | `Map`                 |
| `metaData`                 | `Map<String, Map>`    |
| `groupingHash`             | `String`              |

The native layer will be responsible for tracking the handled/unhandled count based on the handled state in the provided payload, and for using this payload as a seed for constructing the actual payload it will send.

###### Android
```java
public void dispatch(ReadableMap payload, Promise promise)
```

###### iOS
```objc
- (void)dispatch:(NSDictionary *)payload
        resolve:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject;
```

#### `BugsnagReactNative.getPayloadInfo(): Promise<info>`

Retrieves info from the native layer so that JS `beforeSend` callbacks can access it.

###### Android
```java
public void getPayloadInfo(Promise promise)
```

###### iOS
```objc
- (void)getPayloadInfo:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject;
```

`info` should be a `Map<String, any>` containing the following keys:

| Keys          |
|---------------|
| `threads`     |
| `breadcrumbs` |
| `app`         |
| `device`      |
| `metaData`    |
| `user`        |
| `context`     |

#### BugsnagReactNative.leaveBreadcrumb(breadcrumb): void`

Breadcrumbs collected from JS should be sent to the native layer to be stored.

###### Android

```java
void leaveBreadcrumb(ReadableMap breadcrumb)
```

###### iOS
```objc
- (void)leaveBreadcrumb:(NSDictionary *)breadcrumb;
```

The `breadcrumb` map/dictionary must have the following structure in order to be valid:

| Key        | Type                | Required  |
|------------|---------------------|-----------|
| `name`     | String              | yes       |
| `type`     | String              | yes       |
| `metaData` | Map<String, String> | optional  |


#### `BugsnagReactNative.startSession(): void`

Calls straight through to the native `startSession()` method.

#### `BugsnagReactNative.stopSession(): void`

Calls straight through to the native `stopSession()` method.

#### `BugsnagReactNative.resumeSession(): Promise<boolean>`

Calls straight through to the native `resumeSession()` method.

### Fields

#### `BugsnagReactNative.versions: versionMap`

- `(NSDictionary *) versions`:
  - `BugsnagReactNative` version
  - `bugsnag-cocoa` version
- `public static ReadableMap versions`
  - `BugsnagReactNative` version
  - `bugsnag-android` version

The reason for these values being fields rather than exposed via a method is that [on iOS constant values can be exposed so that their access from JS doesn't go across the bridge](https://facebook.github.io/react-native/docs/0.59/native-modules-ios#exporting-constants) (there doesn't seem to be an equivalent on Android but the fields can be `static`/`final`).

## Data transfer

Data sent from JS to native code via the React Native bridge is serialised into the following types:

- `Null`
- `Boolean`
- `Number`
- `String`
- `Map`
- `Array`

Arbitrary data structures can be parsed using the following techniques on each platform:

### iOS

The types of entries in the `NSDictionary` can be determined by using `isKindOfClass` method. Using the following logic, each of the data types above can be detected.

_Note that for booleans, they are a special kind of integer, so the check for that is nested inside the number check._

```objc
// our dictionary passed in via JS
NSDictionary dict = ...;

// iterate over all
for (NSString *key in dict) {
  id value = dict[key];
  if ([value isKindOfClass:[NSString class]]) {
    NSLog(@"%@ is a string: %@", key, value);
  } else if ([value isKindOfClass:[NSNumber class]]) {
    if ([value isKindOfClass:[@YES class]]) {
      NSLog(@"%@ is a boolean: %@", key, value ? @"YES" : @"NO");
    } else {
      NSLog(@"%@ is a number: %@", key, value);
    }
  } else if ([value isKindOfClass:[NSArray class]]) {
    NSLog(@"%@ is an array: %@", key, value);
  } else if ([value isKindOfClass:[NSDictionary class]]) {
    NSLog(@"%@ is a dictionary: %@", key, value);
  } else if ([value isKindOfClass:[NSNull class]]) {
    NSLog(@"%@ is null: %@", key, value);
  } else {
    NSLog(@"%@ is unknown: %@", key, value);
  }
}
```

### Android

RN's `ReadableMap` type in Java provides the means to get the type of each entry `ReadableType getType (String key)`:

```java
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.ReadableMapKeySetIterator;

// our readable map passed in via JS
ReadableMap map = ...;

// iterate over the keys
ReadableMapKeySetIterator it = map.keySetIterator();
while (it.hasNextKey()) {
  String key = it.nextKey();

  // get the type of this entry
  ReadableType type = map.getType(key);

  // switch logic based on its type
  switch (type) {
    case Map:
    case Array:
    case Boolean:
    case String:
    case Number:
    case Null:
    default:
  }
}

```
