@device
Feature: Browser device data

Scenario: Device data is included by default
  When I navigate to the test URL "/device/script/a.html"
  And I wait to receive an error
  Then the request is a valid browser payload for the error reporting API
  And the event "device.time" is not null
  And the event "device.locale" is not null
  And the event "device.userAgent" is not null
  And the event "device.orientation" matches "^(portrait|landscape)(-primary|-secondary)?$"
  And the event device ID is valid

Scenario: Device ID is not collected when the config option is disabled
  When I navigate to the test URL "/device/script/b.html"
  And I wait to receive an error
  Then the request is a valid browser payload for the error reporting API
  And the event "device.time" is not null
  And the event "device.locale" is not null
  And the event "device.userAgent" is not null
  And the event "device.orientation" matches "^(portrait|landscape)(-primary|-secondary)?$"
  And the event "device.id" is null

@skip_if_local_storage_is_unavailable
Scenario: Device ID is read from local storage
  When I navigate to the test URL "/device/script/c.html"
  And I wait to receive an error
  Then the request is a valid browser payload for the error reporting API
  And the event device ID is "cabcdefghijklmnopqrstuvwx"
  When I navigate to the test URL "/device/script/a.html"
  # This is 2 requests because the first request still counts (i.e. it's only 1 _new_ request)
  And I wait to receive 2 errors
  Then the request is a valid browser payload for the error reporting API
  And the event device ID is "cabcdefghijklmnopqrstuvwx"
  When I navigate to the test URL "/device/script/a.html"
  # This is 3 requests because the first 2 requests still count
  And I wait to receive 3 errors
  Then the request is a valid browser payload for the error reporting API
  And the event device ID is "cabcdefghijklmnopqrstuvwx"
