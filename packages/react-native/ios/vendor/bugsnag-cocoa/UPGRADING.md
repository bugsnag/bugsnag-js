# Upgrading

Guide to ease migrations between significant changes

## v5 -> v6

### `BugsnagConfiguration` class

#### Instantiation

Initializing a configuration now requires a valid API key, setting an error
parameter if initialization fails. In Swift, creating a configuration is now
handled via the `try` mechanism.

```objc
NSError *error;
BugsnagConfiguration *config = [[BugsnagConfiguration alloc] initWithApiKey:@"YOUR API KEY HERE"
                                                                      error:&error];
```
```swift
  let config = try BugsnagConfiguration("YOUR API KEY HERE")
```

The exact error is available using the `BSGConfigurationErrorDomain` and
`BSGConfigurationErrorCode` enumeration.

#### Additions

* `Bugsnag.setBreadcrumbCapacity()` is now `config.setMaxBreadcrumbs()`

```diff
- Bugsnag.setBreadcrumbCapacity(40)
  let config = try BugsnagConfiguration("YOUR API KEY HERE")
+ config.setMaxBreadcrumbs(40)
+ config.persistUser

+ config.persistUserData()
+ config.deletePersistedUserData()
```

#### Renames

```diff
- config.autoNotify
+ config.autoDetectErrors

- config.autoCaptureSessions
+ config.autoTrackSessions

- config.onCrashHandler
+ config.onError

- config.beforeSendBlocks
- config.add(beforeSend:)
+ config.onSendBlocks
+ config.add(onSend:)

- config.beforeSessionBlocks
- config.add(beforeSession:)
+ config.onSessionBlocks
+ config.add(onSession:)

- config.automaticallyCollectBreadcrumbs
+ config.enabledBreadcrumbTypes

- config.reportOOMs
+ config.enabledErrorTypes
```

### `Bugsnag` class

#### Removals

* `Bugsnag.setBreadcrumbCapacity()` is now `config.setMaxBreadcrumbs()`

```diff
- Bugsnag.setBreadcrumbCapacity(40)
  let config = try BugsnagConfiguration("YOUR API KEY HERE")
+ config.setMaxBreadcrumbs(40)
```

#### Additions

Retrieve previously set metadata using `getMetadata`:

```swift
Bugsnag.getMetadata("section")
Bugsnag.getMetadata("section" key:"key")
```
```objc
[Bugsnag getMetadata:@"section"];
[Bugsnag getMetadata:@"section" key:@"key"];
```

#### Renames

```diff
ObjC:

- [Bugsnag configuration]
+ [Bugsnag setUser:withName:andEmail:]

- [Bugsnag addAttribute:WithValuetoTabWithName:]
+ [Bugsnag addMetadataToSection:key:value:]

- [Bugsnag clearTabWithName:]
+ [Bugsnag clearMetadataInSection:]

- [Bugsnag stopSession]
+ [Bugsnag pauseSession]

Swift:

- Bugsnag.configuration()
+ Bugsnag.setUser(_:name:email:)

- Bugsnag.addAttribute(attributeName:withValue:toTabWithName:)
+ Bugsnag.addMetadata(_:key:value:)

- Bugsnag.clearTab(name:)
+ Bugsnag.clearMetadata(_ section)

- Bugsnag.stopSession()
+ Bugsnag.pauseSession()
```

### `BugsnagMetadata` class

#### Renames

```diff
ObjC: 

- [BugsnagMetadata clearTabWithName:]
+ [BugsnagMetadata clearMetadataInSection:]

- [BugsnagMetadata getTab:]
+ [BugsnagMetadata getMetadata:]

+ [BugsnagMetadata addMetadataToSection:values:]

Swift:

- BugsnagMetadata.clearTab(name:)
+ BugsnagMetadata.clearMetadata(section:)

- BugsnagMetadata.getTab(name:)
+ BugsnagMetadata.getMetadata(_ section)
```

Note that `BugsnagMetadata.getTab()` previously would create a metadata section if it
did not exist; the new behaviour in `getMetadata` is to return `nil`. 

### `BugsnagBreadcrumb` class

The short "name" value has been removed and replaced with an arbitrarily long "message".

```diff
- BugsnagBreadcrumb.name
+ BugsnagBreadcrumb.message
```

### `BugsnagCrashReport` class

This is now BugsnagEvent.

#### Renames

To add metadata to an individual report in a callback, use `addMetadata` instead
of the removed `addAttribute`:

```diff
- BugsnagCrashReport.addAttribute(_:withValue:toTabWithName:)
+ BugsnagEvent.addMetadata(sectionName:key:value:)
```
