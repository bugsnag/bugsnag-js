Feature: Unhandled promise rejections are reported correctly in lambda functions

@simple-app
Scenario Outline: unhandled promise rejections are reported
    Given I setup the environment
    When I invoke the "<lambda>" lambda in "features/fixtures/simple-app" with the "events/<type>/promise-rejection.json" event
    Then the lambda response "errorMessage" equals "Error: yikes"
    And the lambda response "errorType" equals "Runtime.UnhandledPromiseRejection"
    And the lambda response "trace" is an array with 4 elements
    And the lambda response "trace.0" equals "Runtime.UnhandledPromiseRejection: Error: yikes"
    And the lambda response "body" is null
    And the lambda response "statusCode" is null
    And the SAM exit code equals 0
    When I wait to receive an error
    Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
    And the event "unhandled" is true
    And the event "severity" equals "error"
    And the event "severityReason.type" equals "unhandledPromiseRejection"
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "yikes"
    And the exception "type" equals "nodejs"
    And the "file" of stack frame 0 equals "promise-rejection.js"
    And the event "metaData.AWS Lambda context.functionName" equals "<lambda>"
    And the event "metaData.AWS Lambda context.awsRequestId" is not null
    And the event "device.runtimeVersions.node" matches "^<node-version>\.\d+\.\d+$"
    When I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp

    Examples:
        | lambda                                 | type     | node-version |
        | AsyncPromiseRejectionFunctionNode18    | async    | 18           |
        | CallbackPromiseRejectionFunctionNode18 | callback | 18           |
@simple-app
Scenario Outline: unhandled promise rejections are not reported when autoDetectErrors is false
    Given I setup the environment
    And I set environment variable "BUGSNAG_AUTO_DETECT_ERRORS" to "false"
    When I invoke the "<lambda>" lambda in "features/fixtures/simple-app" with the "events/<type>/promise-rejection.json" event
    Then the lambda response "errorMessage" equals "Error: yikes"
    And the lambda response "errorType" equals "Runtime.UnhandledPromiseRejection"
    And the lambda response "trace" is an array with 6 elements
    And the lambda response "trace.0" equals "Runtime.UnhandledPromiseRejection: Error: yikes"
    And the lambda response "body" is null
    And the lambda response "statusCode" is null
    And the SAM exit code equals 0
    And I should receive no errors

    Examples:
        | lambda                                 | type     |
        | AsyncPromiseRejectionFunctionNode18    | async    |
        | CallbackPromiseRejectionFunctionNode18 | callback |

@serverless-express-app
Scenario: promise rejections are reported when using serverless-express
    Given I setup the environment
    When I invoke the "ExpressFunction" lambda in "features/fixtures/serverless-express-app" with the "events/promise-rejection.json" event
    Then the lambda response "errorMessage" equals "Error: abc"
    And the lambda response "errorType" equals "Runtime.UnhandledPromiseRejection"
    And the lambda response "trace" is an array with 4 elements
    And the lambda response "trace.0" equals "Runtime.UnhandledPromiseRejection: Error: abc"
    And the lambda response "body" is null
    And the lambda response "statusCode" is null
    And the SAM exit code equals 0
    When I wait to receive an error
    Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
    And the event "unhandled" is true
    And the event "severity" equals "error"
    And the event "severityReason.type" equals "unhandledPromiseRejection"
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "abc"
    And the exception "type" equals "nodejs"
    And the "file" of stack frame 0 equals "app.js"
    And the event "metaData.AWS Lambda context.functionName" equals "ExpressFunction"
    And the event "metaData.AWS Lambda context.awsRequestId" is not null
    And the event "device.runtimeVersions.node" matches "^18\.\d+\.\d+$"
    When I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp

    # TODO: investigate why this behaviour has changed (previously the event was not associated with a session - see PLAT-12841)
    # And the event "session.events" is null
    And the event "session.events.handled" equals 0
    And the event "session.events.unhandled" equals 1

@hono-app
Scenario: promise rejections are reported when using hono
    Given I setup the environment
    When I invoke the "HonoFunction" lambda in "features/fixtures/hono-app" with the "events/promise-rejection.json" event
    Then the lambda response "errorMessage" equals "Error: reject"
    And the lambda response "errorType" equals "Runtime.UnhandledPromiseRejection"
    And the lambda response "trace" is an array with 4 elements
    And the lambda response "trace.0" equals "Runtime.UnhandledPromiseRejection: Error: reject"
    And the lambda response "body" is null
    And the lambda response "statusCode" is null
    And the SAM exit code equals 0
    When I wait to receive an error
    Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
    And the event "unhandled" is true
    And the event "severity" equals "error"
    And the event "severityReason.type" equals "unhandledPromiseRejection"
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "reject"
    And the exception "type" equals "nodejs"
    And the "file" of stack frame 0 equals "app.js"
    And the event "metaData.AWS Lambda context.functionName" equals "HonoFunction"
    And the event "metaData.AWS Lambda context.awsRequestId" is not null
    And the event "device.runtimeVersions.node" matches "^18\.\d+\.\d+$"
    When I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp

@hono-app
Scenario Outline: thrown non-error exceptions are reported when using hono
    Given I setup the environment
    When I invoke the "HonoFunction" lambda in "features/fixtures/hono-app" with the "events/throw-non-error.json" event
    Then the lambda response "errorMessage" equals "1"
    And the lambda response "errorType" equals "Runtime.UnhandledPromiseRejection"
    And the lambda response "trace" is an array with 4 elements
    And the lambda response "trace.0" equals "Runtime.UnhandledPromiseRejection: 1"
    And the lambda response "body" is null
    And the lambda response "statusCode" is null
    And the SAM exit code equals 0
    When I wait to receive an error
    Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
    And the event "unhandled" is true
    And the event "severity" equals "error"
    And the event "severityReason.type" equals "unhandledPromiseRejection"
    And the exception "errorClass" equals "InvalidError"
    And the exception "message" matches "unhandledRejection handler received a non-error\."
    And the exception "type" equals "nodejs"
    And the event "metaData.AWS Lambda context.functionName" equals "HonoFunction"
    And the event "metaData.AWS Lambda context.awsRequestId" is not null
    And the event "device.runtimeVersions.node" matches "^18\.\d+\.\d+$"
    When I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp
    And the event "session.events.handled" equals 0
    And the event "session.events.unhandled" equals 1
