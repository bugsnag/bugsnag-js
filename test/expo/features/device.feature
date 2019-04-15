Feature: Expo Device data

Background:
  Given the element "deviceFeature" is present
  And I click the element "deviceFeature"

Scenario: Device data is included by default
  Given the element "deviceDefaultButton" is present
  When I click the element "deviceDefaultButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "DeviceDefaultError"
  And the event "device.id" is not null
  And the event "device.osName" is one of:
    | android |
    | ios     |
  And the event "device.osVersion" is not null
  And the event "device.orientation" equals "portrait"

Scenario: Device data can be modified on the client
  Given the element "deviceClientButton" is present
  When I click the element "deviceClientButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "DeviceClientError"
  And the event "device.id" is not null
  And the event "device.osName" is one of:
    | android |
    | ios     |
  And the event "device.osVersion" equals "testOSVersion"
  And the event "device.newThing" equals "this is new"
  And the event "device.orientation" equals "portrait"

Scenario: Device data can be modified by a callback
  Given the element "deviceCallbackButton" is present
  When I click the element "deviceCallbackButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "DeviceCallbackError"
  And the event "device.id" is not null
  And the event "device.osVersion" is not null
  And the event "device.osName" is one of:
    | android |
    | ios     |
  And the event "device.model" equals "brandNewPhone"
  And the event "device.newThing" equals "another new thing"
  And the event "device.simulator" is false
  And the event "device.orientation" equals "portrait"

Scenario: Device data can be modified by handled options
  Given the element "deviceOptsButton" is present
  When I click the element "deviceOptsButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "DeviceOptsError"
  And the event "device.id" equals "assuming direct control"
  And the event "device.osVersion" is not null
  And the event "device.model" is not null
  And the event "device.simulator" is false
  And the event "device.orientation" is "portrait"
  And the event "device.newThing" equals "not original"