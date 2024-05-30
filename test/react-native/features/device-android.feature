@android_only
Feature: Android Device data

Scenario: Device data in Handled JS error
  When I run "DeviceJsHandledScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "DeviceJsHandledScenario"
  And the event "unhandled" is false

  And the event "device.id" is not null
  And the event "device.jailbroken" is false
  And the event "device.locale" matches "^[a-z]{2}_[A-Z]{2}$"
  And the event "device.manufacturer" is not null
  And the event "device.model" is not null
  And the event "device.osName" equals "android"
  And the event "device.osVersion" matches "^\d+$"
  And the event "device.runtimeVersions.androidApiLevel" is not null
  And the event "device.runtimeVersions.reactNative" matches "^\d+\.\d+\.\d+$"
  And the event "device.runtimeVersions.reactNativeJsEngine" matches "^jsc|hermes$"
  And the event "device.totalMemory" is not null
  And the event "device.freeDisk" is not null
  And the event "device.freeMemory" is not null
  And the event "device.orientation" equals "portrait"
  And the event "device.time" is a timestamp

Scenario: Device data in Unhandled JS error
  When I run "DeviceJsUnhandledScenario" and relaunch the crashed app
  And I configure Bugsnag for "DeviceJsUnhandledScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "DeviceJsUnhandledScenario"
  And the event "unhandled" is true

  And the event "device.id" is not null
  And the event "device.jailbroken" is false
  And the event "device.locale" matches "^[a-z]{2}_[A-Z]{2}$"
  And the event "device.manufacturer" is not null
  And the event "device.model" is not null
  And the event "device.osName" equals "android"
  And the event "device.osVersion" matches "^\d+$"
  And the event "device.runtimeVersions.androidApiLevel" is not null
  And the event "device.runtimeVersions.reactNative" matches "^\d+\.\d+\.\d+$"
  And the event "device.runtimeVersions.reactNativeJsEngine" matches "^jsc|hermes$"
  And the event "device.totalMemory" is not null
  And the event "device.freeDisk" is not null
  And the event "device.freeMemory" is not null
  And the event "device.orientation" equals "portrait"
  And the event "device.time" is a timestamp

Scenario: Device data in Handled native error
  When I run "DeviceNativeHandledScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "java.lang.RuntimeException"
  And the exception "message" equals "DeviceNativeHandledScenario"
  And the event "unhandled" is false

  And the event "device.id" is not null
  And the event "device.jailbroken" is false
  And the event "device.locale" matches "^[a-z]{2}_[A-Z]{2}$"
  And the event "device.manufacturer" is not null
  And the event "device.model" is not null
  And the event "device.osName" equals "android"
  And the event "device.osVersion" matches "^\d+$"
  And the event "device.runtimeVersions.androidApiLevel" is not null
  And the event "device.runtimeVersions.reactNative" matches "^\d+\.\d+\.\d+$"
  And the event "device.runtimeVersions.reactNativeJsEngine" matches "^jsc|hermes$"
  And the event "device.totalMemory" is not null
  And the event "device.freeDisk" is not null
  And the event "device.freeMemory" is not null
  And the event "device.orientation" equals "portrait"
  And the event "device.time" is a timestamp

Scenario: Device data in Unhandled native error
  When I run "DeviceNativeUnhandledScenario" and relaunch the crashed app
  And I configure Bugsnag for "DeviceNativeUnhandledScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "java.lang.RuntimeException"
  And the exception "message" equals "DeviceNativeUnhandledScenario"
  And the event "unhandled" is true

  And the event "device.id" is not null
  And the event "device.jailbroken" is false
  And the event "device.locale" matches "^[a-z]{2}_[A-Z]{2}$"
  And the event "device.manufacturer" is not null
  And the event "device.model" is not null
  And the event "device.osName" equals "android"
  And the event "device.osVersion" matches "^\d+$"
  And the event "device.runtimeVersions.androidApiLevel" is not null
  And the event "device.runtimeVersions.reactNative" matches "^\d+\.\d+\.\d+$"
  And the event "device.runtimeVersions.reactNativeJsEngine" matches "^jsc|hermes$"
  And the event "device.totalMemory" is not null
  And the event "device.freeDisk" is not null
  And the event "device.freeMemory" is not null
  And the event "device.orientation" equals "portrait"
  And the event "device.time" is a timestamp
