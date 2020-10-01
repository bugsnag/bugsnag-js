Upgrading Guide
===============

Upgrade from 5.X to 6.X
-----------------------

__This version contains many breaking changes__. It is part of an effort to unify our notifier libraries across platforms, making the user interface more consistent, and implementations better on multi-layered environments where multiple Bugsnag libraries need to work together (such as React Native).

### Key points

- Several configuration options have been renamed and can now load configuration options from your `Info.plist` file, simplifying Bugsnag initialization. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/configuration-options/#setting-configuration-options) \| [macOS](https://docs.bugsnag.com/platforms/macos/configuration-options/#setting-configuration-options) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/configuration-options/#setting-configuration-options).)
- The `BugsnagEvent` class replaces `BugsnagCrashReport` and now contains all data that will be sent to your Bugsnag dashboard with typed fields, rather than dictionary fields. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-error-reports/#the-bugsnagevent-class) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-error-reports/#the-bugsnagevent-class) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-error-reports/#the-bugsnagevent-class).)
- Callback blocks have been expanded to breadcrumbs (see docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-breadcrumbs/) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-breadcrumbs/) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-breadcrumbs/).) and sessions (see docs: [iOS](https://docs.bugsnag.com/platforms/ios/capturing-sessions/) \| [macOS](https://docs.bugsnag.com/platforms/macos/capturing-sessions/) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/capturing-sessions/).)

More details of these changes can be found below and full documentation is available online:
[iOS](https://docs.bugsnag.com/platforms/ios) |
[macOS](https://docs.bugsnag.com/platforms/macos) |
[tvOS](https://docs.bugsnag.com/platforms/tvos).

### Bugsnag Client

#### Starting Bugsnag

You can now start Bugsnag using your `Info.plist` with configuration values, including your API key. The simplest start-up code is therefore:

```objc
[Bugsnag start];
```
or
```swift
Bugsnag.start()
```

With an entry in your `Info.plist` file:

```xml
<key>bugsnag</key>
<dict>
    <key>apiKey</key>
    <string>YOUR-API-KEY</string>
</dict>
```

You can add further configuration options to your `Info.plist` or construct a `BugsnagConfiguration` to set further options in code. For full details, see the online docs:
[iOS](https://docs.bugsnag.com/platforms/ios/configuration-options/#setting-configuration-options) |
[macOS](https://docs.bugsnag.com/platforms/macos/configuration-options/#setting-configuration-options) |
[tvOS](https://docs.bugsnag.com/platforms/tvos/configuration-options/#setting-configuration-options).

#### Additions

The following functions have been added to the `Bugsnag` client: 

| Property/Method                                                    | Usage                                                             |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `addOnBreadcrumb` / `removeOnBreadcrumb`<br />`addOnBreadcrumbBlock` / `removeOnBreadcrumbBlock` | Add/remove callbacks to modify or discard breadcrumbs before they are recorded. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-breadcrumbs/#discarding-and-amending-breadcrumbs) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-breadcrumbs/#discarding-and-amending-breadcrumbs) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-breadcrumbs/#discarding-and-amending-breadcrumbs).)
| `addMetadata:metadata:toSection` / `addMetadata(metadata:section)` | Adds a dictionary of metadata to a section, shown as a tab on the Bugsnag dashboard. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-error-reports/#global-metadata) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-error-reports/#global-metadata) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-error-reports/#global-metadata).)
| `getMetadataFromSection` / `getMetadata(section)`<br />`getMetadataFromSection:withKey` / `getMetadata(section:key)` | Retrieves previously set metadata from a section, shown as a tab on the Bugsnag dashboard. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-error-reports/#global-metadata) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-error-reports/#global-metadata) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-error-reports/#global-metadata).)
| `setUser:withEmail:andName` / `setUser(_:email:name)`              | Sets the active user for the app for future events. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-error-reports/#adding-user-data) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-error-reports/#adding-user-data) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-error-reports/#adding-user-data).)

#### Changes

The following changes have been made to the `Bugsnag` client: 

| v5.x API                                                           | v6.x API                                                          |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `addAttribute:withValue:toTabWithName:` /<br/> `addAttribute(attributeName:withValue:toTabName)` | `addMetadata:withKey:toSection:` / <br />`addMetadata(metadata:key:section)` |
| `clearTabWithName` / `clearTab(withName:)`                         | `clearMetadataFromSection` / `clearMetadata(section:)`            |
| `startBugsnagWithApiKey`                                           | `startWithApiKey`                                                 |
| `startBugsnagWithConfiguration`                                    | `startWithConfiguration`                                          |
| `stopSession`                                                      | `pauseSession`                                                    |

#### Deprecations

The following properties/methods have been removed from the `Bugsnag` client:

| v5.x API                                                           | v6.x API                                                          |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `BugsnagSeverityError`                                             | Deprecated - no longer public API.                                |
| `BugsnagSeverityWarning`                                           | Deprecated - no longer public API.                                |
| `BugsnagSeverityInfo`                                              | Deprecated - no longer public API.                                |
| `clearBreadcrumbs`                                                 | Deprecated in favor of `OnBreadcrumb` callback blocks. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-breadcrumbs/#discarding-and-amending-breadcrumbs) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-breadcrumbs/#discarding-and-amending-breadcrumbs) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-breadcrumbs/#discarding-and-amending-breadcrumbs).)|
| `configuration`                                                    | Deprecated - no longer public API.                                |
| `notify:withData:` / `notify(exception:withData)`                  | Use `notify:block:` / `notify(exception:block:)` to add data in a block. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/reporting-handled-exceptions/#customizing-diagnostic-data) \| [macOS](https://docs.bugsnag.com/platforms/macos/reporting-handled-exceptions/#customizing-diagnostic-data) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/reporting-handled-exceptions/#customizing-diagnostic-data).) |
| `notify:withData:atSeverity:` / `notify(exception:withData:atSeverity:)` | Use `notify:block:` / `notify(exception:block:)` to add data and set severity in a block. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/reporting-handled-exceptions/#customizing-diagnostic-data) \| [macOS](https://docs.bugsnag.com/platforms/macos/reporting-handled-exceptions/#customizing-diagnostic-data) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/reporting-handled-exceptions/#customizing-diagnostic-data).) |
| `payloadDateFormatter`                                             | Deprecated - no longer public API.                                |
| `setBreadcrumbCapacity`                                            | Now set in `BugsnagConfiguration`: `maxBreadcrumbs`.              |

### Configuration

#### Additions

The following options have been added to the `BugsnagConfiguration` class: 

| Property/Method                                                    | Usage                                                             |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `addOnBreadcrumbBlock` / `addOnBreadcrumb` | Add callbacks to modify or discard breadcrumbs before they are recorded. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-breadcrumbs/#discarding-and-amending-breadcrumbs) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-breadcrumbs/#discarding-and-amending-breadcrumbs) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-breadcrumbs/#discarding-and-amending-breadcrumbs).)
| `addMetadata:metadata:toSection` / `addMetadata(metadata:section)` | Adds a dictionary of metadata to a section, shown as a tab on the Bugsnag dashboard. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-error-reports/#global-metadata) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-error-reports/#global-metadata) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-error-reports/#global-metadata).)
| `clearMetadataFromSection` / `clearMetadata(section)`<br />`clearMetadataFromSection:withKey` / `clearMetadata(section:key)` | Removes previously set metadata from a section, shown as a tab on the Bugsnag dashboard. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-error-reports/#global-metadata) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-error-reports/#global-metadata) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-error-reports/#global-metadata).)
| `getMetadataFromSection` / `getMetadata(section)`<br />`getMetadataFromSection:withKey` / `getMetadata(section:key)` | Retrieves previously set metadata from a section, shown as a tab on the Bugsnag dashboard. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-error-reports/#global-metadata) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-error-reports/#global-metadata) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-error-reports/#global-metadata).)
| `maxBreadcrumbs`                                                   | Sets the maximum number of breadcrumbs which will be stored. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/configuration-options/#maxbreadcrumbs) \| [macOS](https://docs.bugsnag.com/platforms/macos/configuration-options/#maxbreadcrumbs) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/configuration-options/#maxbreadcrumbs).)
| `persistUser`                                                      | Set whether or not Bugsnag should persist user information between application sessions. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/configuration-options/#persistuser) \| [macOS](https://docs.bugsnag.com/platforms/macos/configuration-options/#persistuser) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/configuration-options/#persistuser).)
| `redactedKeys`                                                     | Sets which values should be removed from any `Metadata` objects before sending them to Bugsnag. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/configuration-options/#redactedkeys) \| [macOS](https://docs.bugsnag.com/platforms/macos/configuration-options/#redactedkeys) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/configuration-options/#redactedkeys).)
| `removeOnBreadcrumbBlock` / `removeOnBreadcrumb` | Remove callbacks that modify or discard breadcrumbs before they are recorded. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-breadcrumbs/#discarding-and-amending-breadcrumbs) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-breadcrumbs/#discarding-and-amending-breadcrumbs) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-breadcrumbs/#discarding-and-amending-breadcrumbs).)
| `sendThreads`                                                      | Controls whether we should capture and serialize the state of all threads at the time of an exception. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/configuration-options/#sendthreads) \| [macOS](https://docs.bugsnag.com/platforms/macos/configuration-options/#sendthreads) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/configuration-options/#sendthreads).)

**Note**: Most configuration options can now be set in your `Info.plist` file. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/configuration-options/#setting-configuration-options) \| [macOS](https://docs.bugsnag.com/platforms/macos/configuration-options/#setting-configuration-options) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/configuration-options/#setting-configuration-options).)

#### Changes

The following changes have been made to the `BugsnagConfiguration` class:

| v5.x API                                                           | v6.x API                                                          |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `autoCaptureSessions`                                              | `autoTrackSessions`                                               |
| `automaticallyCollectBreadcrumbs`                                  | `enabledBreadcrumbTypes` (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/configuration-options/#enabledbreadcrumbtypes) \| [macOS](https://docs.bugsnag.com/platforms/macos/configuration-options/#enabledbreadcrumbtypes) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/configuration-options/#enabledbreadcrumbtypes).) |
| `autoNotify`                                                       | `autoDetectErrors`                                                |
| `beforeSendBlocks`                                                 | `addOnSendError` / `addOnSendErrorBlock`<br />`removeOnSendErrorBlock` / `removeOnSendError` |
| `beforeSessionBlocks`                                              | `addOnSession` / `addOnSessionBlock`<br />`removeOnSessionBlock` / `removeOnSession` |
| `currentUser`                                                      | `user`                                                            |
| `metadata`                                                         | `addMetadata` / `clearMetadata` / `getMetadata`                   |
| `notifierType`                                                     | `appType`                                                         |
| `notifyReleaseStages`                                              | `enabledReleaseStages`                                            |
| `notifyURL`                                                        | `setEndpoints(BugsnagEndpointConfiguration)` (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/configuration-options/#endpoints) \| [macOS](https://docs.bugsnag.com/platforms/macos/configuration-options/#endpoints) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/configuration-options/#endpoints).) |
| `reportOOMs`                                                       | `enabledErrorTypes` (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/configuration-options/#enablederrortypes) \| [macOS](https://docs.bugsnag.com/platforms/macos/configuration-options/#enablederrortypes) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/configuration-options/#enablederrortypes).) |
| `sessionURL`                                                       | `setEndpoints(BugsnagEndpointConfiguration)` (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/configuration-options/#endpoints) \| [macOS](https://docs.bugsnag.com/platforms/macos/configuration-options/#endpoints) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/configuration-options/#endpoints).) |
| `setEndpointsForNotify:sessions` / `setEndpoints(notify: sessions)`| `setEndpoints(BugsnagEndpointConfiguration)` (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/configuration-options/#endpoints) \| [macOS](https://docs.bugsnag.com/platforms/macos/configuration-options/#endpoints) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/configuration-options/#endpoints).) |
| `shouldAutoCaptureSessions`                                        | `autoTrackSessions`                                               |

**Note**: `OnSendError` blocks now take a `BugsnagEvent` parameter (see below) only. If you are setting an `onCrashHandler` block to add crash-time data (see docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-error-reports/#crash-time-callbacks) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-error-reports/#crash-time-callbacks) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-error-reports/#crash-time-callbacks)) you must ensure the extra data is added as a string:object dictionary-like entry. This data will then be available as metadata in the `BugsnagEvent`.

#### Deprecations

The following properties/methods have been removed from the `BugsnagConfiguration` class:

| v5.x API                                                           | v6.x API                                                          |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `addBeforeNotifyHook`                                              | Deprecated in favor of callback block argument to `Bugsnag.notify`. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/reporting-handled-exceptions/#customizing-diagnostic-data) \| [macOS](https://docs.bugsnag.com/platforms/macos/reporting-handled-exceptions/#customizing-diagnostic-data) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/reporting-handled-exceptions/#customizing-diagnostic-data).) |
| `breadcrumbs`                                                      | Deprecated in favor of `OnBreadcrumb` callback blocks. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-breadcrumbs/#discarding-and-amending-breadcrumbs) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-breadcrumbs/#discarding-and-amending-breadcrumbs) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-breadcrumbs/#discarding-and-amending-breadcrumbs).) |
| `config`                                                           | Deprecated - no longer public API.                                |
| `codeBundleId`                                                     | Deprecated - no longer public API.                                |
| `errorApiHeaders`                                                  | Deprecated - no longer public API.                                |
| `reportBackgroundOOMs`                                             | Deprecated feature.                                               |
| `sessionApiHeaders`                                                | Deprecated - no longer public API.                                |
| `shouldSendReports`                                                | Deprecated - no longer public API.                                |

### Metadata

Metadata should be managed through the `Bugsnag` client for future events or in a `BugsnagEvent` in a callback, therefore direct access to the `BugsnagMetadata` is no longer part of the public API.

(See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-error-reports/#global-metadata) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-error-reports/#global-metadata) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-error-reports/#global-metadata).)

### Breadcrumbs

#### Additions

See `addOnBreadcrumb` for adding callbacks to access/amended data in the `BugsnagBreadcrumb` object that is about to be recorded.

(See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-breadcrumbs/#discarding-and-amending-breadcrumbs) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-breadcrumbs/#discarding-and-amending-breadcrumbs) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-breadcrumbs/#discarding-and-amending-breadcrumbs).)

#### Changes

The following changes have been made to the `BugsnagBreadcrumb` class:

| v5.x API                                                           | v6.x API                                                          |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `name`                                                             | `message`                                                         |

#### Deprecations

The following properties/methods have been removed:

| v5.x API                                                           | v6.x API                                                          |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `BugsnagBreadcrumb` constructors                                   | Deprecated - no longer public API.                                |
| `BugsnagBreadcrumbs`                                               | Deprecated - no longer public API.                                |


### Events (`BugsnagCrashReport`)

`BugsnagCrashReport` is now called `BugsnagEvent` and contains all the data representing the error that's been captured for access and/or mutation in callbacks.

#### Additions

The following options have been added to the `BugsnagEvent` class: 

| Property/Method                                                    | Usage                                                             |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `addMetadata:metadata:toSection` / `addMetadata(metadata:section)` | Adds a dictionary of metadata to a section, shown as a tab on the Bugsnag dashboard. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-error-reports/#global-metadata) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-error-reports/#global-metadata) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-error-reports/#global-metadata).)
| `clearMetadataFromSection` / `clearMetadata(section)`<br />`clearMetadataFromSection:withKey` / `clearMetadata(section:key)` | Removes previously set metadata from a section, shown as a tab on the Bugsnag dashboard. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-error-reports/#global-metadata) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-error-reports/#global-metadata) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-error-reports/#global-metadata).)
| `getMetadataFromSection` / `getMetadata(section)`<br />`getMetadataFromSection:withKey` / `getMetadata(section:key)` | Retrieves previously set metadata from a section, shown as a tab on the Bugsnag dashboard. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-error-reports/#global-metadata) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-error-reports/#global-metadata) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-error-reports/#global-metadata).)
| `originalError`                                                    | The original object that caused the error in your application. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-error-reports/#originalerror) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-error-reports/#originalerror) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-error-reports/#originalerror).)
| `unhandled`                                                        | Whether the error was detected automatically by Bugsnag or reported manually via notify/notifyError. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-error-reports/#unhandled) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-error-reports/#unhandled) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-error-reports/#unhandled).)
| `user` / `setUser:withEmail:andName` / `setUser(_:email:name)`     | The user of the app when the event occurred. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-error-reports/#setuser) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-error-reports/#setuser) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-error-reports/#setuser).)

#### Changes

Event data is now made available as structured classes on the `device`, `app`, `errors` and `threads` fields on the `BugsnagEvent`, previously this was included in undocumented `NSDictionary` data. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-error-reports/#the-bugsnagevent-class) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-error-reports/#the-bugsnagevent-class) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-error-reports/#the-bugsnagevent-class).)

Each event is now also delivered in a separate request to avoid exceeding Bugsnag's request payload size limit in extreme scenarios.

In addition:

| v5.x API                                                           | v6.x API                                                          |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `addAttribute:withValue:toTabWithName:` /<br/> `addAttribute(attributeName:withValue:toTabName)` | `addMetadata:withKey:toSection:` / <br />`addMetadata(metadata:key:section)` |

#### Deprecations

The following properties/methods have been removed from the `BugsnagEvent` (previously `BugsnagCrashReport`) class:

| v5.x API                                                           | v6.x API                                                          |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `attachCustomStacktrace:type:`                                     | Deprecated - no longer public API.                                |
| `BSGParseSeverity`                                                 | Deprecated - no longer public API.                                |
| `BSGFormatSeverity`                                                | Deprecated - no longer public API.                                |
| `depth`                                                            | Deprecated - no longer public API.                                |
| `enhancedErrorMessageForThread`                                    | Deprecated - no longer public API.                                |
| `error`                                                            | Deprecated - no longer public API.                                |
| `handledState`                                                     | Deprecated in favor of `unhandled` property. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/customizing-error-reports/#unhandled) \| [macOS](https://docs.bugsnag.com/platforms/macos/customizing-error-reports/#unhandled) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/customizing-error-reports/#unhandled).) |
| `enabledReleaseStages`                                             | Deprecated - no longer public API.                                |
| `isIncomplete`                                                     | Deprecated feature.                                               |
| `overrides`                                                        | Deprecated - no longer public API.                                |
| `serializableValueWithTopLevelData`                                | Deprecated - no longer public API.                                |
| `shouldBeSent`                                                     | Deprecated - no longer public API.                                |
| `toJson`                                                           | Deprecated - no longer public API.                                |

#### Depth Replacement

The `depth` property was removed in v6.x of the `bugsnag-cocoa` notifier. To reproduce this behaviour, you can use a [callback](https://docs.bugsnag.com/platforms/ios/customizing-error-reports/#updating-events-using-callbacks) to modify the stacktrace. The functions below will reproduce this behaviour:

> :warning: This can only be achieved using `bugsnag-cocoa` v6.0.1 and above, as the stacktrace array was previously `readonly`.

Using **Swift**, create a function as follows:

```swift
func bugsnagStacktraceDepth(event: BugsnagEvent, depth: Int) -> [BugsnagStackframe] {
    if depth > 0 && depth <= event.errors[0].stacktrace.count { /// Check the depth is in a usable range
        for _ in 0...(depth - 1) {
            /// always trim from the top of the stacktrace (index 0),
            /// `.stacktrace` is re-indexing on each iteration.
            event.errors[0].stacktrace.remove(at: 0)
        }
    } else {
        NSLog("[Bugsnag] Depth parameter was out of range, stacktrace was not trimmed.")
    }
    return event.errors[0].stacktrace
}
```

Then, add a callback:

```swift
let config = BugsnagConfiguration.loadConfig()
config.addOnSendError { (event) -> Bool in
    event.errors[0].stacktrace = self.bugsnagStacktraceDepth(event: event, depth: 1);
    return true
}
Bugsnag.start(with: config)
```

Using **Objective-C**, create a function as follows:

```objc
NSMutableArray<BugsnagStackframe *> * bugsnagStacktraceDepth(BugsnagEvent *event, int depth) {
    NSMutableArray<BugsnagStackframe *> *newStacktrace = event.errors[0].stacktrace.mutableCopy;
    if (depth > 0 && depth <= newStacktrace.count) { /// Check the depth is in a usable range
        for (int index = 0; index < depth; index++) {
            /// always trim from the top of the stacktrace (index 0),
            /// `newStacktrace` is re-indexing on each iteration.
            [newStacktrace removeObjectAtIndex:0];
        }
    } else {
        NSLog(@"[Bugsnag] Depth parameter was out of range, stacktrace was not trimmed.");
    }
    return newStacktrace;
}
```

Then, add a callback:

```objc
BugsnagConfiguration *config = [BugsnagConfiguration loadConfig];
[config addOnSendErrorBlock:^BOOL (BugsnagEvent *event) {
    event.errors[0].stacktrace = bugsnagStacktraceDepth(event, 1);
    return YES;
}];
[Bugsnag startWithConfiguration:config];
```

### Sessions

#### Additions

The following options have been added to the `BugsnagSession` class: 

| Property/Method                                                    | Usage                                                             |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `app`                                                              | A subset of the `app` data contained in error events. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/capturing-sessions/#the-bugsnagsession-class) \| [macOS](https://docs.bugsnag.com/platforms/macos/capturing-sessions/#the-bugsnagsession-class) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/capturing-sessions/#the-bugsnagsession-class).)
| `device`                                                           | A subset of the `device` data contained in error events. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/capturing-sessions/#the-bugsnagsession-class) \| [macOS](https://docs.bugsnag.com/platforms/macos/capturing-sessions/#the-bugsnagsession-class) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/capturing-sessions/#the-bugsnagsession-class).)
| `setUser:withEmail:andName` / `setUser(_:email:name)`     | The user of the app. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/capturing-sessions/#the-bugsnagsession-class) \| [macOS](https://docs.bugsnag.com/platforms/macos/capturing-sessions/#the-bugsnagsession-class) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/capturing-sessions/#the-bugsnagsession-class).)

#### Changes

The following changes have been made to the `BugsnagSession` class:

| v5.x API                                                           | v6.x API                                                          |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `sessionId`                                                        | `id`                                                              |

#### Deprecations

The following properties/methods have been removed from the `BugsnagSession` class:

| v5.x API                                                           | v6.x API                                                          |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `toJson`                                                           | Deprecated - no longer public API.                                |
| `toDictionary`                                                     | Deprecated - no longer public API.                                |
| `stop`                                                             | Deprecated in favour of `pauseSession` on the `Bugsnag` client. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/capturing-sessions/#manual-session-handling) \| [macOS](https://docs.bugsnag.com/platforms/macos/capturing-sessions/#manual-session-handling) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/capturing-sessions/#manual-session-handling).) |
| `resume`                                                           | Deprecated in favour of `resumeSession` on the `Bugsnag` client. (See docs: [iOS](https://docs.bugsnag.com/platforms/ios/capturing-sessions/#manual-session-handling) \| [macOS](https://docs.bugsnag.com/platforms/macos/capturing-sessions/#manual-session-handling) \| [tvOS](https://docs.bugsnag.com/platforms/tvos/capturing-sessions/#manual-session-handling).) |
| `autoCaptured`                                                     | Deprecated - no longer public API.                                |
| `handledCount`                                                     | Deprecated - no longer public API.                                |
| `unhandledCount`                                                   | Deprecated - no longer public API.                                |
| `stopped`                                                          | Deprecated - no longer public API.                                |

### User Information

#### Changes

The following changes have been made to the `BugsnagUser` class:

| v5.x API                                                           | v6.x API                                                          |
| ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `userId`                                                           | `id`                                                              |
| `emailAddress`                                                     | `email`                                                           |
