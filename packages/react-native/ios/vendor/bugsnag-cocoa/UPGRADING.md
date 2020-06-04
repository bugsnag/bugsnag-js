# Upgrading

Guide to ease migrations between significant changes

## v5 -> v6

### `BugsnagConfiguration` class

#### Instantiation

Initializing a configuration requires a valid API key.

```objc
NSError *error;
BugsnagConfiguration *config = [[BugsnagConfiguration alloc] initWithApiKey:@"YOUR API KEY HERE"];
```
```swift
  let config = BugsnagConfiguration("YOUR API KEY HERE")
```

#### Additions

* `Bugsnag.setBreadcrumbCapacity()` is now `config.setMaxBreadcrumbs()`

```diff
- Bugsnag.setBreadcrumbCapacity(40)
  let config = try BugsnagConfiguration("YOUR API KEY HERE")
+ config.setMaxBreadcrumbs(40)
+ config.persistUser

+ config.persistUserData()
+ config.deletePersistedUserData()

+ config.addOnBreadcrumb(block:)
+ config.removeOnBreadcrumb(block:)

+ config.redactedKeys
+ config.sendThreads
```

#### Renames

```diff
- config.autoNotify
+ config.autoDetectErrors

- config.autoCaptureSessions
+ config.autoTrackSessions

- config.beforeSendBlocks
- config.add(beforeSend:)
+ config.onSendBlocks
+ config.addOnSendError(block:)

- config.beforeSessionBlocks
- config.add(beforeSession:)
+ config.onSessionBlocks
+ config.addOnSession(block:)

- config.automaticallyCollectBreadcrumbs
+ config.enabledBreadcrumbTypes

- config.reportOOMs
+ config.enabledErrorTypes

- config.currentUser
+ config.user

- config.notifierType
+ config.appType

- config.notifyReleaseStages
+ config.enabledReleaseStages

- config.setEndpoints(notify: sessions)
+ config.setEndpoints(BugsnagEndpointConfiguration(notify: sessions))
```

#### Removals

```diff
- BugsnagBeforeNotifyHook
- config.metadata
- config.config
- config.breadcrumbs
- config.reportBackgroundOOMs
- config.notifyURL
- config.sessionURL
- config.shouldAutoCaptureSessions
- config.autoNotify
- config.shouldSendReports
- config.errorApiHeaders
- config.sessionApiHeaders
- config.codeBundleId
```

### `Bugsnag` class

#### Removals

* `Bugsnag.setBreadcrumbCapacity()` is now `config.setMaxBreadcrumbs()`

```diff
- Bugsnag.setBreadcrumbCapacity(40)
  let config = try BugsnagConfiguration("YOUR API KEY HERE")
+ config.setMaxBreadcrumbs(40)

- Bugsnag.payloadDateFormatter()
- Bugsnag.clearBreadcrumbs()

- BugsnagSeverityError
- BugsnagSeverityWarning
- BugsnagSeverityInfo
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

`startWithApiKey` and `startWithConfiguration` now return a `BugsnagClient`.

#### Renames

```diff
ObjC:

- [Bugsnag startBugsnagWithApiKey]
+ [Bugsnag startWithApiKey]

- [Bugsnag startBugsnagWithConfiguration]
+ [Bugsnag startWithConfiguration]

- [Bugsnag configuration]
+ [Bugsnag setUser:withEmail:andName:]

- [Bugsnag addAttribute:WithValuetoTabWithName:]
+ [Bugsnag addMetadataToSection:key:value:]

- [Bugsnag clearTabWithName:]
+ [Bugsnag clearMetadataInSection:]

- [Bugsnag stopSession]
+ [Bugsnag pauseSession]

- [Bugsnag notify:withData:]
+ [Bugsnag notify:block:]

- [Bugsnag notify:withData:severity:]
+ [Bugsnag notify:block:]

Swift:
- Bugsnag.startBugsnagWith(:apiKey)
+ Bugsnag.startWith(:apiKey)

- Bugsnag.startBugsnagWith(:configuration)
+ Bugsnag.startWith(:configuration)

- Bugsnag.configuration()
+ Bugsnag.setUser(_:email:name:)

- Bugsnag.addAttribute(attributeName:withValue:toTabWithName:)
+ Bugsnag.addMetadata(_:key:value:)

- Bugsnag.clearTab(name:)
+ Bugsnag.clearMetadata(_ section)

- Bugsnag.stopSession()
+ Bugsnag.pauseSession()

- Bugsnag.notify(exception:metadata:)
+ Bugsnag.notify(exception:block:)

- Bugsnag.notify(exception:metadata:severity:)
+ Bugsnag.notify(exception:block:)
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

#### Removals

```diff
- toDictionary
- delegate
```

### `BugsnagBreadcrumb` class

The short "name" value has been removed and replaced with an arbitrarily long "message".

```diff
- BugsnagBreadcrumb.name
+ BugsnagBreadcrumb.message
```

`BugsnagBreadcrumbs` is no longer publicly accessible, along with `BugsnagBreadcrumb` constructors.

### `BugsnagCrashReport` class

This is now BugsnagEvent.

#### Additions

```diff
+ event.unhandled
+ event.originalError
+ event.user
+ event.setUser
```

`event.device` is now a structured class with properties for each value, rather than an `NSDictionary`.
`event.app` is now a structured class with properties for each value, rather than an `NSDictionary`.
`event.errors` is now an array containing a structured class with properties for each `BugsnagError` value.
`event.threads` is now an array containing a structured class with properties for each `BugsnagThread` value.

#### Renames

To add metadata to an individual report in a callback, use `addMetadata` instead
of the removed `addAttribute`:

```diff
- BugsnagCrashReport.addAttribute(_:withValue:toTabWithName:)
+ BugsnagEvent.addMetadata(sectionName:key:value:)
```

#### Removals

```diff
- BSGParseSeverity
- BSGFormatSeverity
- [event serializableValueWithTopLevelData:]
- [event shouldBeSent:]
- [event toJson:]
- [event enhancedErrorMessageForThread:]
- event.enabledReleaseStages
- event.handledState
- event.overrides
- event.depth
- event.error
- event.isIncomplete
- [event attachCustomStacktrace:type:]

### `BugsnagSession` class

#### Additions

```diff
+ session.id
+ session.setUser(id:name:email:)
+ session.user
+ session.app
+ session.device
```

#### Removals

```diff
- toJson
- toDictionary
- stop
- resume
- autoCaptured
- handledCount
- unhandledCount
- stopped
- user
- sessionId
```

### `BugsnagUser` class

#### Renames

```diff
- userId
+ id

- emailAddress
+ email
```
