@ip_redaction
Feature: Redacting IP addresses

Scenario: setting collectUserIp option to false
  When I navigate to the test URL "/ip_redaction/script/a.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the event "request.clientIp" equals "[REDACTED]"
  And the event "user.id" equals "[REDACTED]"

Scenario: setting collectUserIp option to false and providing user id
  When I navigate to the test URL "/ip_redaction/script/b.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the event "request.clientIp" equals "[REDACTED]"
  And the event "user.id" equals "cjhc3k8wg0000zdojufo6nw6c"
