Feature: Reporting unhandled errors

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"

Scenario: reporting thrown exception which is not caught
  And I run the service "unhandled" with the command "node scenarios/thrown-error-not-caught"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the error payload field "events.0.app.type" equals "node"
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledException"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "not handled"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/thrown-error-not-caught.js"
  And the "lineNumber" of stack frame 0 equals 10

Scenario: not reporting uncaughtExceptions when autoDetectErrors is off
  And I run the service "unhandled" with the command "node scenarios/thrown-error-not-caught-auto-notify-off"
  And I wait for 1 second
  Then I should receive no requests

Scenario: reporting unhandled promise rejections
  And I run the service "unhandled" with the command "node scenarios/unhandled-promise-rejection"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledPromiseRejection"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "not handled"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/unhandled-promise-rejection.js"
  And the "lineNumber" of stack frame 0 equals 10

Scenario: reporting unhandled promise rejections
  And I run the service "unhandled" with the command "node scenarios/unhandled-promise-rejection"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledPromiseRejection"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "not handled"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/unhandled-promise-rejection.js"
  And the "lineNumber" of stack frame 0 equals 10

Scenario: not reporting unhandledRejections when autoDetectErrors is off
  And I run the service "unhandled" with the command "node scenarios/unhandled-promise-rejection-auto-notify-off"
  And I wait for 1 second
  Then I should receive no requests

Scenario: overridden handled state in a callback
  And I run the service "unhandled" with the command "node scenarios/modify-unhandled-callback"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  # The severity is "warning" because only the handled-ness has been changed
  And event 0 is unhandled with the severity "warning"
  And the "file" of stack frame 0 equals "scenarios/modify-unhandled-callback.js"
  And the "lineNumber" of stack frame 0 equals 10
