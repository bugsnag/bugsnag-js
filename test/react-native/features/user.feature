Feature: User data

Scenario: User data can be set via the client
  When I run "UserClientScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "UserClientError"
  And the event "user.id" equals "1234"
  And the event "user.name" equals "UserClient"

# Callback set user is overridden by native default
@wip
Scenario: User data can be set via a callback
  When I run "UserCallbackScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "UserCallbackError"
  And the event "user.id" equals "1234"
  And the event "user.name" equals "UserCallback"
