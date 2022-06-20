@skip_before_node_16
Feature: Error.cause

Background:
  Given I store the api key in the environment variable "BUGSNAG_API_KEY"
  And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
  And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"

Scenario: Error thrown with a cause in the constructor
  When I run the service "cause" with the command "node scenarios/error_constructor"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the error payload field "events.0.exceptions" is an array with 2 elements
  And the error payload field "events.0.exceptions.0.errorClass" equals "Error"
  And the error payload field "events.0.exceptions.0.message" equals "I am the error"
  And the error payload field "events.0.exceptions.0.type" equals "nodejs"
  And the error payload field "events.0.exceptions.0.stacktrace" is a non-empty array
  And the error payload field "events.0.exceptions.1.errorClass" equals "Error"
  And the error payload field "events.0.exceptions.1.message" equals "I am the cause"
  And the error payload field "events.0.exceptions.1.type" equals "nodejs"
  And the error payload field "events.0.exceptions.1.stacktrace" is an non-empty array

Scenario: Error thrown with a cause assigned
  When I run the service "cause" with the command "node scenarios/error_assignment"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the error payload field "events.0.exceptions" is an array with 2 elements
  And the error payload field "events.0.exceptions.0.errorClass" equals "Error"
  And the error payload field "events.0.exceptions.0.message" equals "I am the error"
  And the error payload field "events.0.exceptions.0.type" equals "nodejs"
  And the error payload field "events.0.exceptions.0.stacktrace" is a non-empty array
  And the error payload field "events.0.exceptions.1.errorClass" equals "Error"
  And the error payload field "events.0.exceptions.1.message" equals "I am the cause"
  And the error payload field "events.0.exceptions.1.type" equals "nodejs"
  And the error payload field "events.0.exceptions.1.stacktrace" is a non-empty array

Scenario: Error thrown with a cause string
  When I run the service "cause" with the command "node scenarios/string"
  And I wait to receive an error
  Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
  And the error payload field "events.0.exceptions" is an array with 2 elements
  And the error payload field "events.0.exceptions.0.errorClass" equals "Error"
  And the error payload field "events.0.exceptions.0.message" equals "I am the error"
  And the error payload field "events.0.exceptions.0.type" equals "nodejs"
  And the error payload field "events.0.exceptions.0.stacktrace" is a non-empty array
  And the error payload field "events.0.exceptions.1.errorClass" equals "Error"
  And the error payload field "events.0.exceptions.1.message" equals "I am the cause"
  And the error payload field "events.0.exceptions.1.type" equals "nodejs"
  And the error payload field "events.0.exceptions.1.stacktrace" is an array with 0 elements
