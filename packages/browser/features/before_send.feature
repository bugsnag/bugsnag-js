@before_send
Feature: beforeSend callbacks

Scenario: modifying report via beforeSend in config
  When I navigate to the URL "/before_send/script/a.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the event "metaData.before_send.global" equals "works"

Scenario: ignoring report via beforeSend in config (return false)
  When I navigate to the URL "/before_send/script/b.html"
  And I wait for 1 second
  Then I should receive no requests

Scenario: ignoring report via beforeSend in config (report.ignore())
  When I navigate to the URL "/before_send/script/c.html"
  And I wait for 1 second
  Then I should receive no requests

Scenario: setting beforeSend in notify opts
  When I navigate to the URL "/before_send/script/d.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the event "metaData.before_send.notify_opts" equals "works"

Scenario: ignoring report via beforeSend in notify opts (return false)
  When I navigate to the URL "/before_send/script/e.html"
  And I wait for 1 second
  Then I should receive no requests

Scenario: ignoring report via beforeSend in notify opts (report.ignore())
  When I navigate to the URL "/before_send/script/f.html"
  And I wait for 1 second
  Then I should receive no requests
