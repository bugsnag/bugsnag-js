Feature: contextualize plugin

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"

Scenario: using contextualize to add context to an error
  And I run the service "contextualize" with the command "node scenarios/contextualize"
  And I wait to receive 2 errors

  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is false
  And the event "severity" equals "warning"
  And the event "severityReason.type" equals "handledException"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "manual notify"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/contextualize.js"
  And the "lineNumber" of stack frame 0 equals 16
  And the event "metaData.subsystem.name" equals "manual notify"
  And the event has a "manual" breadcrumb named "manual notify"
  And the event has a "log" breadcrumb named "Console output"

  And I discard the oldest error

  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledException"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "ENOENT: no such file or directory, open 'does not exist'"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/contextualize.js"
  And the "lineNumber" of stack frame 0 equals 21
  And the event "metaData.subsystem.name" equals "fs reader"
  And the event has a "manual" breadcrumb named "opening file"
  And the event does not have a "manual" breadcrumb with message "manual notify"
  And the event does not have a "log" breadcrumb

@skip_before_node_16
Scenario: using contextualize with an unhandled rejection (with context added)
  And I run the service "contextualize" with the command "node scenarios/contextualize-unhandled-rejection"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledPromiseRejection"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "unhandled rejection"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/contextualize-unhandled-rejection.js"
  And the "lineNumber" of stack frame 0 equals 12
  And the event "metaData.subsystem.name" equals "fs reader"
  And the event "metaData.subsystem.widgetsAdded" equals "cat,dog,mouse"

Scenario: using contextualize with an unhandled rejection (no context added)
  And I run the service "contextualize" with the command "node scenarios/contextualize-unhandled-rejection"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the event "unhandled" is true
  And the event "severity" equals "error"
  And the event "severityReason.type" equals "unhandledPromiseRejection"
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "unhandled rejection"
  And the exception "type" equals "nodejs"
  And the "file" of stack frame 0 equals "scenarios/contextualize-unhandled-rejection.js"
  And the "lineNumber" of stack frame 0 equals 12