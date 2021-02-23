Feature: Unhandled exceptions are reported correctly in lambda functions

Scenario: unhandled exception in an async lambda
    Given I store the api key in the environment variable "BUGSNAG_API_KEY"
    And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
    And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"
    When I invoke the "AsyncUnhandledExceptionFunction" lambda in "features/fixtures/simple-app" with the "events/async/unhandled-exception.json" event
    Then the lambda response "errorMessage" equals "Oh no!"
    And the lambda response "errorType" equals "Error"
    And the lambda response "trace" is an array with 4 elements
    And the lambda response "trace.0" equals "Error: Oh no!"
    And the lambda response "body" is null
    And the lambda response "statusCode" is null
    And the SAM exit code equals 0
    When I wait to receive an error
    Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
    And the event "unhandled" is true
    And the event "severity" equals "error"
    And the event "severityReason.type" equals "unhandledException"
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "Oh no!"
    And the exception "type" equals "nodejs"
    And the "file" of stack frame 0 equals "unhandled-exception.js"
    And the event "metaData.AWS Lambda context.functionName" equals "AsyncUnhandledExceptionFunction"
    And the event "metaData.AWS Lambda context.awsRequestId" is not null
