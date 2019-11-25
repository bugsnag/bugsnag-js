Feature: React-native Device data

Scenario: Device data is included by default
  When I run "DeviceDefaultScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "DeviceDefaultError"
  And the event "device.id" is not null
  And the event "device.osName" equals one of:
    | android |
    | iOS     |
  And the event "device.osVersion" is not null
  And the event "device.orientation" equals "portrait"
  And the event "device.runtimeVersions.reactNative" matches "\d+\.\d+\.\d"
  And the event "device.runtimeVersions.osBuild" is not null
  And the event "device.totalMemory" is not null
  And the event "device.osName" is not null
  And the event "device.jailbroken" is false
