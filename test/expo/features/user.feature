Feature: User data

Background:
  Given the element "userFeature" is present
  And I click the element "userFeature"

Scenario: User data can be set via the client
  Given the element "userClientButton" is present
  When I click the element "userClientButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "UserClientError"
  And the event "user.name" equals "userClientName"

Scenario: User data can be set via a callback
  Given the element "userCallbackButton" is present
  When I click the element "userCallbackButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "UserCallbackError"
  And the event "user.name" equals "userCallbackName"
