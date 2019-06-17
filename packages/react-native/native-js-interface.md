# Native/JS interface

This is a working spec of this the interface that the native layer (`BugsnagReactNative.{java|m}`) exposes to JavaScript.

## Intro

`BugsnagReactNative` is a class which will be instantiated once for the entire runtime and accessible via JS. It's responsible for managing the instantiation of the native client (either `bugsnag-android` or `bugsnag-cocoa`) and providing forwarding on data and invocations from JS to the native client.

## Accessing `BugsnagReactNative` from JavaScript

Access is set up in the standard React Native way<sup>[1](https://facebook.github.io/react-native/docs/0.59/native-modules-ios),[2](https://facebook.github.io/react-native/docs/0.59/native-modules-android)</sup> such that `BugsnagReactNative` is available in JavaScript like so:

```js
const { NativeModules } = require('react-native')
const NativeClient = NativeModules.BugsnagReactNative
```

## API

### `BugsnagReactNative.leaveBreadcrumb(breadcrumb): void`

Breadcrumbs collected from JS should be sent to the native layer to be stored.

- Android: `void leaveBreadcrumb(ReadableMap breadcrumb)`
- iOS `- (void)leaveBreadcrumb:(NSDictionary *)breadcrumb;`

The `breadcrumb` map/dictionary must have the following structure in order to be valid<sup>1</sup>:

| Key        | Type                | Required  |
|------------|---------------------|-----------|
| `name`     | String              | yes       |
| `type`     | String              | yes       |
| `metaData` | Map<String, String> | optional  |


<sup>1</sup> This cannot be constrained by the type signature because these arguments go across the React Native bridge, and so only a predetermined set of crude data types can be specified.

### `BugsnagReactNative.updateClientState(updates): void`

Updates to mutable client state in JS (e.g. `metaData`, `user`) should be replicated and stored in the native layer.

- Android: `void updateClientState(ReadableMap updates)`
- iOS `- (void)updateClientState:(NSDictionary *)updates;`

The keys in the updates map are the names of the properties to be updated and the values are encoded objects containing the new value for that property. The list of allowed keys is:

- `user`
- `metaData`

And the structure each value must be a [typed map](#typed-map).

### `BugsnagReactNative.deliver(payload): Promise<boolean>`

Send a report that was created in JS-land.

- Android: `public void deliver(ReadableMap payload, Promise promise)`
- iOS:
    ```objc
    - (void)deliver:(NSDictionary *)payload
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject;
    ```

### `BugsnagReactNative.getNativePayloadInfo(payload): Promise<info>`

Retrieves info from the native layer so that JS `beforeSend` callbacks can access it.

- Android: `public void getNativePayloadInfo(Promise promise)`
- iOS:
    ```objc
    - (void)getNativePayloadInfo:(RCTPromiseResolveBlock)resolve
                       reject:(RCTPromiseRejectBlock)reject;
    ```


## Type definitions

### Typed map

```
VALUE =
  | STRING
  | NUMBER
  | BOOLEAN
  | MAP
  | LIST

STRING = {
  "type": "string",
  "value": "this is a string"
}

NUMBER = {
  "type": "number",
  "value": 123456
}

BOOLEAN = {
  "type": "boolean",
  "value": true
}

MAP = {
  "type": "map",
  "value": {
    [key: string]: VALUE
  }
}

LIST = {
  "type": "list",
  "value": {
    [index: number]: VALUE
    …
  }
}
```
