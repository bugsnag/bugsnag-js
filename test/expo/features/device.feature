Feature: Expo Device data

Background:
  Given the element "appFeature" is present
  And I click the element "appFeature"

Scenario: Device data is included by default
  Given the element "deviceClientButton" is present
  When I click the element "deviceClientButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "DeviceClientError"
  And the event "device.id" is not null
  And the event "device.osBuild" is not null
  And the event "device.osVersion" is not null
  And the event "device.model" is not null
  And the event "device.simulator" is false

Scenario: Device data can be modified by a callback
  Given the element "deviceCallbackButton" is present
  When I click the element "deviceCallbackButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "DeviceCallbackError"
  And the event "device.id" is not null
  And the event "device.osBuild" is not null
  And the event "device.osVersion" is not null
  And the event "device.model" is not null
  And the event "device.simulator" is false

Scenario: Device data can be modified by handled options
  Given the element "deviceOptsButton" is present
  When I click the element "deviceOptsButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "DeviceOptsError"
  And the event "device.id" is not null
  And the event "device.osBuild" is not null
  And the event "device.osVersion" is not null
  And the event "device.model" is not null
  And the event "device.simulator" is false