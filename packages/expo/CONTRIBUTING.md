# @bugnsnag/expo contributing guide

## Keeping dependencies in sync

The Expo notifier depends on some modules whose native code, if it exists, is bundled with Expo core. That means the version we depend on must match, otherwise we get conflicts and/or there are native/JS interface differences.

When a new version of the Expo SDK is released, the dependencies we use must be checked to see if they are up to date.

The following modules are currently used:

- `@react-native-community/netinfo` (`@bugsnag/delivery-expo`, `@bugsnsag/plugin-react-native-connectivity-breadcrumbs`)
- `expo-application` (`@bugsnag/plugin-expo-app`)
- `expo-constants` (`@bugsnag/expo`, `@bugsnag/plugin-expo-app`, `@bugsnag/plugin-expo-device`)
- `expo-crypto` (`@bugsnag/expo`, `@bugsnag/delivery-expo`)
- `expo-device` (`@bugsnag/plugin-expo-device`)
- `expo-file-system` (`@bugsnag/delivery-expo`)

If you add a new dependency please add it to this list.

To check what native module versions are bundled with Expo, check this file:

https://github.com/expo/expo/blob/master/packages/expo/bundledNativeModules.json

## Updating the CLI to install a compatible notifier version

When the version of the bundled native modules changes the notifier will be incompatible with previous Expo SDKs. To prevent installing the conflicting versions, we need to update the CLI using the established pattern in [`packages/expo-cli/commands/install.js`](../expo-cli/commands/install.js).

This should also be added to [the manual setup docs](https://docs.bugsnag.com/platforms/react-native/expo/manual-setup/#installation).
