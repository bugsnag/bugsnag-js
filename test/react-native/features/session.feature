Feature: Sessions

Scenario: Automatic session on app start
  When I run "SessionAutoEnabledScenario"
  Then I wait to receive a request
  And the "bugsnag-api-key" header equals "12312312312312312312312312312312"
  And the "bugsnag-payload-version" header equals "1.0"
  And the "Content-Type" header equals "application/json"
  And the "Bugsnag-Sent-At" header is a timestamp
  And the payload field "notifier.name" equals "Bugsnag React Native"
  And the payload field "notifier.url" equals "https://github.com/bugsnag/bugsnag-js"
  And the payload field "notifier.version" is not null
  And the payload field "app" is not null
  And the payload field "device" is not null
  And the payload has a valid sessions array

Scenario: Automatic sessions disabled
  When I run "SessionAutoDisabledScenario"
  And I wait for 5 seconds
  Then I should receive no requests

Scenario: Manual sessions (JS)
  When I run "SessionManualJsScenario"
  Then I wait to receive 5 requests
  And the "bugsnag-api-key" header equals "12312312312312312312312312312312"
  And the "bugsnag-payload-version" header equals "1.0"
  And the "Content-Type" header equals "application/json"
  And the "Bugsnag-Sent-At" header is a timestamp
  And the payload field "notifier.name" equals "Bugsnag React Native"
  And the payload field "notifier.url" equals "https://github.com/bugsnag/bugsnag-js"
  And the payload field "notifier.version" is not null
  And the payload field "app" is not null
  And the payload field "device" is not null
  And the payload has a valid sessions array

  And I discard the oldest request

  And the exception "errorClass" equals "Error"
  And the exception "message" equals "SessionManualJsScenarioA"
  And the event "unhandled" is false
  And the event "session" is not null

  And I discard the oldest request

  And the exception "errorClass" equals "Error"
  And the exception "message" equals "SessionManualJsScenarioB"
  And the event "unhandled" is false
  And the event "session" is null

  And I discard the oldest request

  And the payload has a valid sessions array

  And I discard the oldest request

  And the exception "errorClass" equals "Error"
  And the exception "message" equals "SessionManualJsScenarioC"
  And the event "unhandled" is false
  And the event "session" is not null
