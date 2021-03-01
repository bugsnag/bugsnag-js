Feature: Unhandled exceptions are reported correctly in lambda functions

Scenario Outline: unhandled exceptions are reported
    Given I setup the environment
    When I invoke the "<lambda>" lambda in "features/fixtures/simple-app" with the "events/<type>/unhandled-exception.json" event
    Then the lambda response "errorMessage" equals "Oh no!"
    And the lambda response "errorType" equals "Error"
    And the lambda response "trace" is an array with <trace-length> elements
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
    And the event "metaData.AWS Lambda context.functionName" equals "<lambda>"
    And the event "metaData.AWS Lambda context.awsRequestId" is not null
    And the event "device.runtimeVersions.node" matches "^<node-version>\.\d+\.\d+$"
    When I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp

    Examples:
        | lambda                                   | type     | node-version | trace-length |
        | AsyncUnhandledExceptionFunctionNode14    | async    | 14           | 4            |
        | AsyncUnhandledExceptionFunctionNode12    | async    | 12           | 4            |
        | CallbackUnhandledExceptionFunctionNode14 | callback | 14           | 7            |
        | CallbackUnhandledExceptionFunctionNode12 | callback | 12           | 7            |

Scenario Outline: no error is reported when autoDetectErrors is false
    Given I setup the environment
    And I set environment variable "BUGSNAG_AUTO_DETECT_ERRORS" to "false"
    When I invoke the "<lambda>" lambda in "features/fixtures/simple-app" with the "events/<type>/unhandled-exception.json" event
    Then I should receive no errors

    Examples:
        | lambda                                   | type     |
        | AsyncUnhandledExceptionFunctionNode14    | async    |
        | AsyncUnhandledExceptionFunctionNode12    | async    |
        | CallbackUnhandledExceptionFunctionNode14 | callback |
        | CallbackUnhandledExceptionFunctionNode12 | callback |
