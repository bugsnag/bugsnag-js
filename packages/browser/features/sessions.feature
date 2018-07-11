@sessions
Feature: Session tracking

Scenario Outline: tracking sessions by default
  When I navigate to the URL "/sessions/<type>/a.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the session tracking API
    Examples:
      | type       |
      | script     |

Scenario Outline: autoCaptureSessions=false
  When I navigate to the URL "/sessions/<type>/b.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive no requests
    Examples:
      | type       |
      | script     |
