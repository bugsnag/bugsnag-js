@ip_redaction
Feature: Redacting IP addresses

@skip_if_local_storage_is_unavailable
Scenario: setting collectUserIp option to false
  When I navigate to the test URL "/ip_redaction/script/a.html"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And the event "device.id" is not null
  And the error payload field "events.0.device.id" is stored as the value "device_id"
  And the event "request.clientIp" equals "[REDACTED]"
  And the event "user.id" is not null
  And the error payload field "events.0.user.id" equals the stored value "device_id"

Scenario: setting collectUserIp option to false and providing user id
  When I navigate to the test URL "/ip_redaction/script/b.html"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And the event "request.clientIp" equals "[REDACTED]"
  And the event "user.id" equals "cjhc3k8wg0000zdojufo6nw6c"
