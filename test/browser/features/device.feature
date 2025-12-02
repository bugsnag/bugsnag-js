@device
Feature: Browser device data

Scenario: Device data is included by default
  When I navigate to the test URL "/device/script/enabled.html"
  And I wait to receive an error
  Then the error is a valid browser payload for the error reporting API
  And the event "device.time" is not null
  And the event "device.locale" is not null
  And the event "device.userAgent" is not null
  And the event "device.orientation" matches "^(portrait|landscape)(-primary|-secondary)?$"
  And the event device ID is valid

Scenario: Device ID is not collected when the config option is disabled
  When I navigate to the test URL "/device/script/disabled.html"
  And I wait to receive an error
  Then the error is a valid browser payload for the error reporting API
  And the event "device.time" is not null
  And the event "device.locale" is not null
  And the event "device.userAgent" is not null
  And the event "device.orientation" matches "^(portrait|landscape)(-primary|-secondary)?$"
  And the event "device.id" is null

@skip_if_local_storage_is_unavailable
Scenario: Device ID is read from local storage
  When I navigate to the test URL "/device/script/store_id.html"
  And I wait to receive an error
  Then the error is a valid browser payload for the error reporting API
  And the event device ID is "cabcdefghijklmnopqrstuvwx"
  And I discard the oldest error

  When I navigate to the test URL "/device/script/enabled.html"
  And I wait to receive an error
  Then the error is a valid browser payload for the error reporting API
  And the event device ID is "cabcdefghijklmnopqrstuvwx"
  And I discard the oldest error

  When I navigate to the test URL "/device/script/enabled.html"
  And I wait to receive an error
  Then the error is a valid browser payload for the error reporting API
  And the event device ID is "cabcdefghijklmnopqrstuvwx"
