@auto_detect_errors
Feature: Switching off automatic reporting

Scenario: setting autoNotify option to false
  When I navigate to the URL "/auto_detect_errors/script/a.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the event "unhandled" is false
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "manual notify does work"
  And the exception "type" equals "browserjs"
