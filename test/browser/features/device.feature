@device
Feature: Browser device data

Scenario: Device data is included by default
  When I navigate to the URL "/on_error/script/a.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the event "device.time" is not null
  And the event "device.locale" is not null
  And the event "device.userAgent" is not null
  And the event "device.orientation" matches "^(portrait|landscape)(-primary|-secondary)?$"
