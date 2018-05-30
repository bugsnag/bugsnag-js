@auto_notify
Feature: Switching off automatic reporting

Scenario Outline: setting autoNotify option to false
  When I navigate to the URL "/auto_notify/<type>/a.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the event "unhandled" is false
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "auto notify does work"
    Examples:
      | type       |
      | script     |
