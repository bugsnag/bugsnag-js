@on_error
Feature: onError callbacks

Scenario: modifying report via onError in config
  When I navigate to the URL "/on_error/script/a.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the event "metaData.on_error.global" equals "works"

Scenario: ignoring report via onError in config (return false)
  When I navigate to the URL "/on_error/script/b.html"
  And I wait for 1 second
  Then I should receive no requests

Scenario: ignoring report via onError in config (report.ignore())
  When I navigate to the URL "/on_error/script/c.html"
  And I wait for 1 second
  Then I should receive no requests

Scenario: setting onError in notify opts
  When I navigate to the URL "/on_error/script/d.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the event "metaData.on_error.notify_opts" equals "works"

Scenario: ignoring report via onError in notify opts (return false)
  When I navigate to the URL "/on_error/script/e.html"
  And I wait for 1 second
  Then I should receive no requests

Scenario: ignoring report via onError in notify opts (report.ignore())
  When I navigate to the URL "/on_error/script/f.html"
  And I wait for 1 second
  Then I should receive no requests
