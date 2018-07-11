@ip_redaction
Feature: Redacting IP addresses

Scenario Outline: setting collectUserIp option to false
  When I navigate to the URL "/ip_redaction/<type>/a.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the event "request.clientIp" equals "[NOT COLLECTED]"
  And the event "user.id" equals "[NOT COLLECTED]"
    Examples:
      | type       |
      | script     |

Scenario Outline: setting collectUserIp option to false and providing user id
  When I navigate to the URL "/ip_redaction/<type>/b.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the event "request.clientIp" equals "[NOT COLLECTED]"
  And the event "user.id" equals "cjhc3k8wg0000zdojufo6nw6c"
    Examples:
      | type       |
      | script     |
