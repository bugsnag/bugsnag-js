@bugsnag_integrity
Feature: Bugsnag-Integrity header

Scenario Outline: Bugsnag-Integrity header stress testing
  When I navigate to the URL "/bugsnag_integrity/script/<file>.html"
  And I wait to receive a request
  Then the request is a valid browser payload for the error reporting API
  And the Bugsnag-Integrity header is valid

  Examples:
    | file                   |
    | cyrillic               |
    | emoji_basic            |
    | emoji_combined         |
    | emoji_combined_encoded |
    | emoji_large_string     |
    | empty_string           |
    | encoded                |
    | large_string           |
