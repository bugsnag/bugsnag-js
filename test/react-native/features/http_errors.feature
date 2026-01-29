Feature: HTTP Errors

Scenario Outline: Error is reported for network requests with error status code
  When I run "NetworkRequestScenario" with data "<status_code>"
  And I wait to receive an error
  Then the error payload field "events.0.context" matches the regex "^GET [0-9.]*:[0-9]{4}$"
  And the error payload field "events.0.exceptions" matches the JSON fixture in "features/fixtures/expected_http_errors/<status_code>.json"
    Examples:
    | status_code |
    | 401         |
    | 500         |

Scenario Outline: Error is not reported for successful network requests
  When I run "NetworkRequestScenario" with data "<status_code>"
  Then I should receive no errors
    Examples:
    | status_code |
    | 200         |
    | 307         |