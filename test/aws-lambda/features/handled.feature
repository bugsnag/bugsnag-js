Feature: Handled exceptions are reported correctly in lambda functions

Scenario: handled exception in an async lambda
    Given I store the api key in the environment variable "BUGSNAG_API_KEY"
    And I store the notify endpoint in the environment variable "BUGSNAG_NOTIFY_ENDPOINT"
    And I store the sessions endpoint in the environment variable "BUGSNAG_SESSIONS_ENDPOINT"
    When I invoke the "AsyncHandledExceptionFunction" lambda in "features/fixtures/simple-app" with the "events/async/handled-exception.json" event
    Then the lambda response "body.message" equals "Did not crash!"
    And the lambda response "statusCode" equals 200
    And the SAM exit code equals 0
    When I wait to receive an error
    Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
    And the event "unhandled" is false
    And the event "severity" equals "warning"
    And the event "severityReason.type" equals "handledException"
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "Hello!"
    And the exception "type" equals "nodejs"
    And the "file" of stack frame 0 equals "handled-exception.js"
    And the event "metaData.AWS Lambda context.functionName" equals "AsyncHandledExceptionFunction"
    And the event "metaData.AWS Lambda context.awsRequestId" is not null
