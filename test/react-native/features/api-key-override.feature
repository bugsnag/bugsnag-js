Feature: API key override

Scenario: Handled JS error overrides API key
  When I run "EventApiKeyOverrideScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "EventApiKeyOverrideScenario"
  And the exception "type" equals "reactnativejs"
  And the event "unhandled" is false
  And the error payload field "apiKey" equals "abf0deabf0deabf0deabf0deabf0de12"
