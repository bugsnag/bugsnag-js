@on_error
Feature: onError callbacks

Scenario: modifying report via onError in config
  When I navigate to the test URL "/on_error/script/onerror_config.html"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And the event "metaData.on_error.global" equals "works"

Scenario: ignoring report via onError in config (return false)
  When I navigate to the test URL "/on_error/script/onerror_config_false.html"
  Then I should receive no errors

Scenario: setting onError in notify opts
  When I navigate to the test URL "/on_error/script/onerror_notify.html"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And the event "metaData.on_error.notify_opts" equals "works"

Scenario: ignoring report via onError in notify opts (return false)
  When I navigate to the test URL "/on_error/script/onerror_notify_false.html"
  Then I should receive no errors
