Feature: Proxy support

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"

Scenario: using options to configure a proxy
  And I have built the service "proxy"
  And I run the service "proxy" with the command "node scenarios/config-proxy"
  And I wait for 1 second
  Then I should receive a request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the event "severityReason.type" equals "handledException"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "hi via proxy"
