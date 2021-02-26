Feature: Unhandled exceptions are reported correctly in lambda functions

Scenario: unhandled exception in an async lambda
    Given I setup the environment
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
    When I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp

Scenario: unhandled exception in an callback lambda
    Given I setup the environment
    When I invoke the "CallbackUnhandledExceptionFunction" lambda in "features/fixtures/simple-app" with the "events/callback/unhandled-exception.json" event
    Then the lambda response "errorMessage" equals "Oh no!"
    And the lambda response "errorType" equals "Error"
    And the lambda response "trace" is an array with 7 elements
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
    And the event "metaData.AWS Lambda context.functionName" equals "CallbackUnhandledExceptionFunction"
    And the event "metaData.AWS Lambda context.awsRequestId" is not null
    When I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp
