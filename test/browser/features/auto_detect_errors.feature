@auto_detect_errors
Feature: Switching off automatic reporting

Scenario: setting autoDetectErrors option to false
  When I navigate to the test URL "/auto_detect_errors/script/autodetect_false.html"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And the event "unhandled" is false
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "manual notify does work"
  And the exception "type" equals "browserjs"

Scenario: setting enabledErrorTypes.unhandledExceptions option to false
  When I navigate to the test URL "/auto_detect_errors/script/unhandled_exceptions_false.html"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And the event "unhandled" is false
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "manual notify does work"
  And the exception "type" equals "browserjs"

Scenario: setting enabledErrorTypes.unhandledRejections option to false
  When I navigate to the test URL "/auto_detect_errors/script/unhandled_rejections_false.html"
  And the test should run in this browser
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And the event "unhandled" is false
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "manual notify does work"
  And the exception "type" equals "browserjs"
