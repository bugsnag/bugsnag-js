@ios_only
Feature: iOS Device data

Scenario: Device data in Handled JS error
  When I run "DeviceJsHandledScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "DeviceJsHandledScenario"
  And the event "unhandled" is false

  And the event "device.id" matches "^(\d|[abcdef]){40}$"
  And the event "device.orientation" equals "portrait"
  And the event "device.osName" equals "iOS"
  And the event "device.jailbroken" is false
  And the event "device.osVersion" matches "^\d+\.\d+(.\d+)?$"
  And the event "device.time" is a timestamp
  And the event "device.locale" is not null
  And the event "device.runtimeVersions.reactNative" matches "^\d+\.\d+\.\d+$"
  And the event "device.runtimeVersions.osBuild" is not null
  And the event "device.runtimeVersions.clangVersion" matches "^\d+\.\d+\.\d+.+$"
  And the event "device.runtimeVersions.reactNativeJsEngine" matches "^jsc|hermes$"
  And the error payload field "events.0.device.freeMemory" is greater than 0
  And the event "device.manufacturer" equals "Apple"
  # Skipped - PLAT-11345
  # And the error payload field "events.0.device.freeDisk" is greater than 0
  And the event "device.modelNumber" is not null
  And the event "device.model" matches "^iPhone|iPad(\d|[,\.])+$"
  And the error payload field "events.0.device.totalMemory" is greater than 0

Scenario: Device data in Unhandled JS error
  When I run "DeviceJsUnhandledScenario" and relaunch the crashed app
  And I configure Bugsnag for "DeviceJsUnhandledScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "DeviceJsUnhandledScenario"
  And the event "unhandled" is true

  And the event "device.id" matches "^(\d|[abcdef]){40}$"
  And the event "device.orientation" equals "portrait"
  And the event "device.osName" equals "iOS"
  And the event "device.jailbroken" is false
  And the event "device.osVersion" matches "^\d+\.\d+(.\d+)?$"
  And the event "device.time" is a timestamp
  And the event "device.locale" is not null
  And the event "device.runtimeVersions.reactNative" matches "^\d+\.\d+\.\d+$"
  And the event "device.runtimeVersions.osBuild" is not null
  And the event "device.runtimeVersions.clangVersion" matches "^\d+\.\d+\.\d+.+$"
  And the event "device.runtimeVersions.reactNativeJsEngine" matches "^jsc|hermes$"
  And the error payload field "events.0.device.freeMemory" is greater than 0
  And the event "device.manufacturer" equals "Apple"
  # Skipped - PLAT-11345
  # And the error payload field "events.0.device.freeDisk" is greater than 0
  And the event "device.modelNumber" is not null
  And the event "device.model" matches "^iPhone|iPad(\d|[,\.])+$"
  And the error payload field "events.0.device.totalMemory" is greater than 0

Scenario: Device data in Handled native error
  When I run "DeviceNativeHandledScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "NSException"
  And the exception "message" equals "DeviceNativeHandledScenario"
  And the event "unhandled" is false

  And the event "device.id" matches "^(\d|[abcdef]){40}$"
  And the event "device.orientation" equals "portrait"
  And the event "device.osName" equals "iOS"
  And the event "device.jailbroken" is false
  And the event "device.osVersion" matches "^\d+\.\d+(.\d+)?$"
  And the event "device.time" is a timestamp
  And the event "device.locale" is not null
  And the event "device.runtimeVersions.reactNative" matches "^\d+\.\d+\.\d+$"
  And the event "device.runtimeVersions.osBuild" is not null
  And the event "device.runtimeVersions.clangVersion" matches "^\d+\.\d+\.\d+.+$"
  And the event "device.runtimeVersions.reactNativeJsEngine" matches "^jsc|hermes$"
  And the error payload field "events.0.device.freeMemory" is greater than 0
  And the event "device.manufacturer" equals "Apple"
  # Skipped - PLAT-11345
  # And the error payload field "events.0.device.freeDisk" is greater than 0
  And the event "device.modelNumber" is not null
  And the event "device.model" matches "^iPhone|iPad(\d|[,\.])+$"
  And the error payload field "events.0.device.totalMemory" is greater than 0

# Skipped on iOS New Arch pending PLAT-12184
@skip_new_arch
Scenario: Device data in Unhandled native error
  When I run "DeviceNativeUnhandledScenario" and relaunch the crashed app
  And I configure Bugsnag for "DeviceNativeUnhandledScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "NSException"
  And the exception "message" equals "DeviceNativeUnhandledScenario"
  And the event "unhandled" is true

  And the event "device.id" matches "^(\d|[abcdef]){40}$"
  And the event "device.osName" equals "iOS"
  And the event "device.jailbroken" is false
  And the event "device.osVersion" matches "^\d+\.\d+(.\d+)?$"
  And the event "device.time" is a timestamp
  And the event "device.locale" is not null
  And the event "device.runtimeVersions.reactNative" matches "^\d+\.\d+\.\d+$"
  And the event "device.runtimeVersions.reactNativeJsEngine" matches "^jsc|hermes$"
  And the event "device.runtimeVersions.osBuild" is not null
  And the event "device.runtimeVersions.clangVersion" matches "^\d+\.\d+\.\d+.+$"
  And the error payload field "events.0.device.freeMemory" is greater than 0
  And the event "device.manufacturer" equals "Apple"
  # Skipped - PLAT-11345
  # And the error payload field "events.0.device.freeDisk" is greater than 0
  And the event "device.modelNumber" is not null
  And the event "device.model" matches "^iPhone|iPad(\d|[,\.])+$"
  And the error payload field "events.0.device.totalMemory" is greater than 0

# TODO: remove this scenario when PLAT-12184 is resolved
@skip_old_arch
Scenario: Device data in Unhandled native error
  When I run "DeviceNativeUnhandledScenario" and relaunch the crashed app
  And I configure Bugsnag for "DeviceNativeUnhandledScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "N8facebook3jsi7JSErrorE"
  And the exception "message" starts with "Exception in HostFunction: DeviceNativeUnhandledScenario"
  And the event "unhandled" is true

  And the event "device.id" matches "^(\d|[abcdef]){40}$"
  And the event "device.osName" equals "iOS"
  And the event "device.jailbroken" is false
  And the event "device.osVersion" matches "^\d+\.\d+(.\d+)?$"
  And the event "device.time" is a timestamp
  And the event "device.locale" is not null
  And the event "device.runtimeVersions.reactNative" matches "^\d+\.\d+\.\d+$"
  And the event "device.runtimeVersions.reactNativeJsEngine" matches "^jsc|hermes$"
  And the event "device.runtimeVersions.osBuild" is not null
  And the event "device.runtimeVersions.clangVersion" matches "^\d+\.\d+\.\d+.+$"
  And the error payload field "events.0.device.freeMemory" is greater than 0
  And the event "device.manufacturer" equals "Apple"
  # Skipped - PLAT-11345
  # And the error payload field "events.0.device.freeDisk" is greater than 0
  And the event "device.modelNumber" is not null
  And the event "device.model" matches "^iPhone|iPad(\d|[,\.])+$"
  And the error payload field "events.0.device.totalMemory" is greater than 0