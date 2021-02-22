Feature: Reporting handled errors

Scenario: Calling notify() with a caught Error
  When I run "HandledJsErrorScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "HandledJsErrorScenario"
  And the exception "type" equals "reactnativejs"
  And the event "unhandled" is false

Scenario: Native notify() with a caught Error
  When I run "HandledNativeErrorScenario"
  Then I wait to receive an error
  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the event "exceptions.0.type" equals the platform-dependent string:
  | android | android |
  | ios     | cocoa   |
  And the exception "message" equals "HandledNativeErrorScenario"
  And the event "unhandled" is false
