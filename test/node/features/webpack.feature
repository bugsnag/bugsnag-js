@skip_before_node_6
@skip_node_18
Feature: Webpack bundling support for node apps

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"

Scenario: calling notify() with an error
  And I run the service "webpack" with the command "node dist/index.bundle.js"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the event "severityReason.type" equals "handledException"
  And the exception "errorClass" equals "Error"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "dist/index.bundle.js"
