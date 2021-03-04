Feature: Reporting runtime versions

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"

Scenario: report for unhandled event contains runtime version information
  And I run the service "unhandled" with the command "node scenarios/thrown-error-not-caught"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "device.runtimeVersions.node" matches "(\d+\.){2}\d+"

Scenario: report for handled event contains runtime version information
  And I run the service "handled" with the command "node scenarios/notify"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is false
  And the event "device.runtimeVersions.node" matches "(\d+\.){2}\d+"

Scenario: session payload contains runtime version information
  And I run the service "sessions" with the command "node scenarios/start-session"
  And I wait to receive a session
  Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
  And the session payload has a valid sessions array
  And the session payload field "device.runtimeVersions.node" matches the regex "(\d+\.){2}\d+"

  