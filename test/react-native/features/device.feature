Feature: React-native Device data

Scenario: Device data is included by default
  When I run "DeviceDefaultScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "DeviceDefaultError"
  And the event "device.id" is not null
  And the event "device.osName" equals one of:
    | android |
    | ios     |
  And the event "device.osVersion" is not null
  And the event "device.orientation" equals "portrait"
  And the event "device.time" is not null
  And the event "device.runtimeVersions.reactNative" matches "\d+\.\d+\.\d"
  And the event "device.runtimeVersions.expoApp" matches "\d+\.\d+\.\d"
  And the event "device.runtimeVersions.expoSdk" matches "\d+\.\d+\.\d"
  And the event "metaData.device.isDevice" is true
  And the event "metaData.device.appOwnership" equals "standalone"
