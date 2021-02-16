Feature: Handled exceptions are reported correctly in lambda functions

Scenario: handled exception in an async lambda
    Given I store the api key in the environment variable "BUGSNAG_API_KEY"
    When I invoke the "AsyncHandledExceptionFunction" lambda in "features/fixtures/simple-app" with the "events/async/handled-exception.json" event
    Then the lambda response "body.message" equals "Did not crash!"
    And the lambda response "statusCode" equals 200
    And the SAM exit code equals 0
