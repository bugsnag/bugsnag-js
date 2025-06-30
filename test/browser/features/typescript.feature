Feature: Compatibility with TypeScript 3.8

Scenario: TypeScript 3.8 does not error
    When I navigate to the test URL "/typescript_3_8"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API
    And the error payload field "events.0.exceptions.0.message" equals "TypeScript 3.8 compatibility test error"
