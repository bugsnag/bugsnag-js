Feature: Handled exceptions are reported correctly in lambda functions

@simple-app
Scenario Outline: handled exceptions are reported
    Given I setup the environment
    When I invoke the "<lambda>" lambda in "features/fixtures/simple-app" with the "events/<type>/handled-exception.json" event
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
    And the event "metaData.AWS Lambda context.functionName" equals "<lambda>"
    And the event "metaData.AWS Lambda context.awsRequestId" is not null
    And the event "device.runtimeVersions.node" matches "^<node-version>\.\d+\.\d+$"
    When I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp

    Examples:
        | lambda                                 | type     | node-version |
        | AsyncHandledExceptionFunctionNode18    | async    | 18           |
        | CallbackHandledExceptionFunctionNode18 | callback | 18           |

@simple-app
Scenario Outline: handled exceptions are still reported when autoDetectErrors is false
    Given I setup the environment
    And I set environment variable "BUGSNAG_AUTO_DETECT_ERRORS" to "false"
    When I invoke the "<lambda>" lambda in "features/fixtures/simple-app" with the "events/<type>/handled-exception.json" event
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
    And the event "metaData.AWS Lambda context.functionName" equals "<lambda>"
    And the event "metaData.AWS Lambda context.awsRequestId" is not null
    And the event "device.runtimeVersions.node" matches "^<node-version>\.\d+\.\d+$"
    When I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp

    Examples:
        | lambda                                 | type     | node-version |
        | AsyncHandledExceptionFunctionNode18    | async    | 18           |
        | CallbackHandledExceptionFunctionNode18 | callback | 18           |

@serverless-express-app
Scenario: handled exceptions are reported when using serverless-express
    Given I setup the environment
    When I invoke the "ExpressFunction" lambda in "features/fixtures/serverless-express-app" with the "events/handled.json" event
    Then the lambda response "body.message" equals "did not crash :)"
    And the lambda response "statusCode" equals 200
    And the SAM exit code equals 0
    When I wait to receive an error
    Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
    And the event "unhandled" is false
    And the event "severity" equals "warning"
    And the event "severityReason.type" equals "handledException"
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "no crashing here"
    And the exception "type" equals "nodejs"
    And the "file" of stack frame 0 equals "app.js"
    And the event "metaData.AWS Lambda context.functionName" equals "ExpressFunction"
    And the event "metaData.AWS Lambda context.awsRequestId" is not null
    And the event "device.runtimeVersions.node" matches "^18\.\d+\.\d+$"
    When I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp
    And the event "session.events.handled" equals 1
    And the event "session.events.unhandled" equals 0
