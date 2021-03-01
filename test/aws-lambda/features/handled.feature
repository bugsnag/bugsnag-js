Feature: Handled exceptions are reported correctly in lambda functions

Scenario: handled exception in an async lambda
    Given I setup the environment
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
    When I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp

Scenario: handled exception in a callback lambda
    Given I setup the environment
    When I invoke the "CallbackHandledExceptionFunction" lambda in "features/fixtures/simple-app" with the "events/callback/handled-exception.json" event
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
    And the event "metaData.AWS Lambda context.functionName" equals "CallbackHandledExceptionFunction"
    And the event "metaData.AWS Lambda context.awsRequestId" is not null
    When I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp

Scenario: handled exceptions are still reported in an async lambda when autoDetectErrors is false
    Given I setup the environment
    And I set environment variable "BUGSNAG_AUTO_DETECT_ERRORS" to "false"
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
    When I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp

Scenario: handled exceptions are still reported in a callback lambda when autoDetectErrors is false
    Given I setup the environment
    And I set environment variable "BUGSNAG_AUTO_DETECT_ERRORS" to "false"
    When I invoke the "CallbackHandledExceptionFunction" lambda in "features/fixtures/simple-app" with the "events/callback/handled-exception.json" event
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
    And the event "metaData.AWS Lambda context.functionName" equals "CallbackHandledExceptionFunction"
    And the event "metaData.AWS Lambda context.awsRequestId" is not null
    When I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp
