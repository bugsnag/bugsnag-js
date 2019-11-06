@on_error_callbacks
Feature: onError callbacks

Scenario: modifying report via onError in config
  When I navigate to the URL "/on_error_callbacks/script/a.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the event "metaData.on_error.global" equals "works"

Scenario: ignoring report via onError in config (return false)
  When I navigate to the URL "/on_error_callbacks/script/b.html"
  And I wait for 1 second
  Then I should receive no requests

Scenario: setting onError in notify args
  When I navigate to the URL "/on_error_callbacks/script/c.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the event "metaData.on_error.notify_args" equals "works"

Scenario: ignoring report via onError in notify args
  When I navigate to the URL "/on_error_callbacks/script/d.html"
  And I wait for 1 second
  Then I should receive no requests
