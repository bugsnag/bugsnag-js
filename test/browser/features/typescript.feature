Feature: Compatibility with TypeScript

Scenario Outline: TypeScript <version> does not error
    When I navigate to the test URL "/typescript/<directory>/index.html"
    And I wait to receive an error
    Then the error is a valid browser payload for the error reporting API
    And the error payload field "events.0.exceptions.0.message" equals "TypeScript 3.8 compatibility test error"

  Examples:
    | version    | directory   |
    | 3.8        | 3_8         | 
