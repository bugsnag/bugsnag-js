Feature: Loading config from a file

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"

Scenario: loading config from package.json
  And I run the service "config-file" with the command "node scenarios/app"
  And I wait to receive a request
  Then the request is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "app.releaseStage" equals "staging"
  And the event "app.type" equals "worker"
  And the event "app.version" equals "1.0.0"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "nope"
  And the exception "type" equals "nodejs"
  And the event "metaData.serviceCredentials.host" equals "authentication.xyz"
  And the event "metaData.serviceCredentials.accessToken" equals "[REDACTED]"
