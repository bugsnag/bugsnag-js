Feature: Unhandled exceptions are reported correctly in lambda functions

Scenario: unhandled exception in an async lambda
    Given I store the api key in the environment variable "BUGSNAG_API_KEY"
    When I invoke the "AsyncUnhandledExceptionFunction" lambda in "features/fixtures/simple-app" with the "events/async/unhandled-exception.json" event
    Then the lambda response "errorMessage" equals "Oh no!"
    And the lambda response "errorType" equals "Error"
    And the lambda response "trace" is an array with 3 elements
    And the lambda response "trace.0" equals "Error: Oh no!"
    And the lambda response "body" is null
    And the lambda response "statusCode" is null
    And the SAM exit code equals 0
