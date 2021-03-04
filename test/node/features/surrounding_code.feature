Feature: Loading surrounding code for stackframes

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"

Scenario: loading surrounding code by default
  And I run the service "surrounding_code" with the command "node scenarios/send-code-default"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the error payload field "events.0.exceptions.0.stacktrace.0.code" matches the JSON fixture in "features/fixtures/surrounding_code/scenarios/template.json"

Scenario: loading surrouding code when sendCode=true
  And I run the service "surrounding_code" with the command "node scenarios/send-code-on"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the error payload field "events.0.exceptions.0.stacktrace.0.code" matches the JSON fixture in "features/fixtures/surrounding_code/scenarios/template.json"

Scenario: not loading surrouding code when sendCode=false
  And I run the service "surrounding_code" with the command "node scenarios/send-code-off"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the error payload field "events.0.exceptions.0.stacktrace.0.code" is null