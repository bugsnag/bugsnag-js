Feature: Proxy support

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"

Scenario: using options to configure a proxy
  And I run the service "proxy" with the command "node scenarios/config-proxy"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the event "severityReason.type" equals "handledException"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "hi via proxy"

Scenario: making sure no request get through a bad proxy
  And I run the service "proxy" with the command "node scenarios/misconfigured-proxy"
  And I wait for 1 second
  Then I should receive no errors
