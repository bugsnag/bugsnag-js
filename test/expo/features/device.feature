Feature: Expo Device data

Background:
  Given the element "deviceFeature" is present
  And I click the element "deviceFeature"

Scenario: Device data is included by default
  Given the element "deviceDefaultButton" is present
  When I click the element "deviceDefaultButton"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "DeviceDefaultError"
  And the event "device.id" is not null
  And the event "device.manufacturer" is not null
  And the event "device.osName" equals the current OS name
  And the event "device.osVersion" is not null
  And the event "device.orientation" equals "portrait"
  And the event "device.time" is not null
  And the event "device.runtimeVersions.reactNative" matches "\d+\.\d+\.\d"
  And the event "device.runtimeVersions.expoApp" matches "\d+\.\d+\.\d"
  And the event "device.runtimeVersions.expoSdk" matches "\d+\.\d+\.\d"
  And the event "device.totalMemory" is not null
  And the event "metaData.device.isDevice" is true
  And the event "metaData.device.appOwnership" equals "standalone"
  And the error Bugsnag-Integrity header is valid

Scenario: Device data can be modified by a callback
  Given the element "deviceCallbackButton" is present
  When I click the element "deviceCallbackButton"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "DeviceCallbackError"
  And the event "device.id" is not null
  And the event "device.manufacturer" is not null
  And the event "device.osVersion" is not null
  And the event "device.osName" equals the current OS name
  And the event "device.model" equals "brandNewPhone"
  And the event "device.newThing" equals "another new thing"
  And the event "device.orientation" equals "portrait"
  And the event "device.time" is not null
  And the event "device.runtimeVersions.reactNative" matches "\d+\.\d+\.\d"
  And the event "device.runtimeVersions.expoApp" matches "\d+\.\d+\.\d"
  And the event "device.runtimeVersions.expoSdk" matches "\d+\.\d+\.\d"
  And the event "device.totalMemory" is not null
  And the event "metaData.device.isDevice" is true
  And the event "metaData.device.appOwnership" equals "standalone"
  And the error Bugsnag-Integrity header is valid
