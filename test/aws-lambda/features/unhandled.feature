Feature: Unhandled exceptions are reported correctly in lambda functions

@simple-app
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
    And the "file" of stack frame 0 equals "<file>"
    And the event "metaData.AWS Lambda context.functionName" equals "<lambda>"
    And the event "metaData.AWS Lambda context.awsRequestId" is not null
    And the event "device.runtimeVersions.node" matches "^<node-version>\.\d+\.\d+$"
    When I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp

    Examples:
        | lambda                                         | type     | file                          | node-version | trace-length |
        | AsyncUnhandledExceptionFunctionNode18          | async    | unhandled-exception.js        | 18           | 4            |
        | CallbackUnhandledExceptionFunctionNode18       | callback | unhandled-exception.js        | 18           | 7            |
        | CallbackThrownUnhandledExceptionFunctionNode18 | callback | thrown-unhandled-exception.js | 18           | 7            |

@simple-app
Scenario Outline: unhandled exceptions thrown async are reported
    Given I setup the environment
    When I invoke the "<lambda>" lambda in "features/fixtures/simple-app" with the "events/<type>/async-unhandled-exception.json" event
    And the SAM exit code equals 0
    When I wait to receive an error
    Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
    And the event "unhandled" is true
    And the event "severity" equals "error"
    And the event "severityReason.type" equals "unhandledException"
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "Oh no!"
    And the exception "type" equals "nodejs"
    And the "file" of stack frame 0 equals "<file>"
    And the event "metaData.AWS Lambda context.functionName" equals "<lambda>"
    And the event "metaData.AWS Lambda context.awsRequestId" is not null
    And the event "device.runtimeVersions.node" matches "^<node-version>\.\d+\.\d+$"
    When I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp

    Examples:
        | lambda                                     | type  | file                         | node-version | trace-length |
        | AsyncAsyncUnhandledExceptionFunctionNode18 | async | async-unhandled-exception.js | 18           | 4            |

@simple-app
Scenario Outline: no error is reported when autoDetectErrors is false
    Given I setup the environment
    And I set environment variable "BUGSNAG_AUTO_DETECT_ERRORS" to "false"
    When I invoke the "<lambda>" lambda in "features/fixtures/simple-app" with the "events/<type>/unhandled-exception.json" event
    Then I should receive no errors

    Examples:
        | lambda                                         | type     |
        | AsyncUnhandledExceptionFunctionNode18          | async    |
        | CallbackUnhandledExceptionFunctionNode18       | callback |
        | CallbackThrownUnhandledExceptionFunctionNode18 | callback |

@serverless-express-app
Scenario Outline: unhandled exceptions are reported when using serverless-express
    Given I setup the environment
    When I invoke the "ExpressFunction" lambda in "features/fixtures/serverless-express-app" with the "events/<event-name>.json" event
    Then the lambda response "body.message" equals "<message>"
    And the lambda response "body.type" equals "Error"
    And the lambda response "body.stacktrace" is an array with 11 elements
    And the lambda response "body.stacktrace.0" equals "Error: <message>"
    And the lambda response "statusCode" equals 500
    And the SAM exit code equals 0
    When I wait to receive an error
    Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
    And the event "unhandled" is true
    And the event "severity" equals "error"
    And the event "severityReason.type" equals "unhandledErrorMiddleware"
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "<message>"
    And the exception "type" equals "nodejs"
    And the "file" of stack frame 0 equals "app.js"
    And the event "metaData.AWS Lambda context.functionName" equals "ExpressFunction"
    And the event "metaData.AWS Lambda context.awsRequestId" is not null
    And the event "device.runtimeVersions.node" matches "^18\.\d+\.\d+$"
    When I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp
    And the event "session.events.handled" equals 0
    And the event "session.events.unhandled" equals 1

    Examples:
        | event-name      | message   |
        | unhandled       | broken :( |
        | unhandled-next  | borked    |

@serverless-express-app
Scenario: unhandled asynchronous exceptions are reported when using serverless-express
    Given I setup the environment
    When I invoke the "ExpressFunction" lambda in "features/fixtures/serverless-express-app" with the "events/unhandled-async.json" event
    And the SAM exit code equals 0
    When I wait to receive an error
    Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
    And the event "unhandled" is true
    And the event "severity" equals "error"
    And the event "severityReason.type" equals "unhandledErrorMiddleware"
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "busted"
    And the exception "type" equals "nodejs"
    And the "file" of stack frame 0 equals "app.js"
    And the event "metaData.AWS Lambda context.functionName" equals "ExpressFunction"
    And the event "metaData.AWS Lambda context.awsRequestId" is not null
    And the event "device.runtimeVersions.node" matches "^18\.\d+\.\d+$"
    When I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp
    And the event "session.events.handled" equals 0
    And the event "session.events.unhandled" equals 1

@hono-app
Scenario Outline: unhandled exceptions are reported when using hono
    Given I setup the environment
    When I invoke the "HonoFunction" lambda in "features/fixtures/hono-app" with the "events/unhandled.json" event
    And the SAM exit code equals 0
    When I wait to receive an error
    Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
    And the event "unhandled" is true
    And the event "severity" equals "error"
    And the event "severityReason.type" equals "unhandledErrorMiddleware"
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "sync"
    And the exception "type" equals "nodejs"
    And the "file" of stack frame 0 equals "app.js"
    And the event "metaData.AWS Lambda context.functionName" equals "HonoFunction"
    And the event "metaData.AWS Lambda context.awsRequestId" is not null
    And the event "device.runtimeVersions.node" matches "^18\.\d+\.\d+$"
    When I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp
    And the event "session.events.handled" equals 0
    And the event "session.events.unhandled" equals 1

@hono-app
Scenario Outline: unhandled asynchronous exceptions are reported when using hono
    Given I setup the environment
    When I invoke the "HonoFunction" lambda in "features/fixtures/hono-app" with the "events/unhandled-async.json" event
    And the SAM exit code equals 0
    When I wait to receive an error
    Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
    And the event "unhandled" is true
    And the event "severity" equals "error"
    And the event "severityReason.type" equals "unhandledErrorMiddleware"
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "async"
    And the exception "type" equals "nodejs"
    And the "file" of stack frame 0 equals "app.js"
    And the event "metaData.AWS Lambda context.functionName" equals "HonoFunction"
    And the event "metaData.AWS Lambda context.awsRequestId" is not null
    And the event "device.runtimeVersions.node" matches "^18\.\d+\.\d+$"
    When I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp
    And the event "session.events.handled" equals 0
    And the event "session.events.unhandled" equals 1

