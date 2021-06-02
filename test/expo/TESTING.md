### Expo testing

The Expo tests drive real, remote mobile devices using BrowserStack. As a Bugsnag employee you can access the necessary credentials in our shared password manager.

They also require access to the Expo ecosystem in order to publish, then build, the installable app packages. As above, these credentials can also be found in the shared password manager.

The following environment variables need to be set:

- `DEVICE_TYPE`: the mobile operating system you want to test on – one of ANDROID_5_0, ANDROID_6_0, ANDROID_7_1, ANDROID_8_1, ANDROID_9_0, IOS_10, IOS_11, IOS_12
- `MAZE_DEVICE_FARM_USERNAME`
- `MAZE_DEVICE_FARM_ACCESS_KEY`
- `EXPO_USERNAME`
- `EXPO_PASSWORD`

To run against an android device:

```sh
DEVICE_TYPE=ANDROID_9_0 \
EXPO_USERNAME=xxx \
EXPO_PASSWORD=xxx \
  npm run test:expo:android
```

Running tests against an iOS device locally is not currently supported.
