Feature: Loading surrounding code for stackframes

Background:
  Given I set environment variable "BUGSNAG_API_KEY" to "9c2151b65d615a3a95ba408142c8698f"
  And I configure the bugsnag notify endpoint

Scenario Outline: loading surrounding code by default
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "surrounding_code"
  And I run the service "surrounding_code" with the command "node scenarios/send-code-default"
  And I wait for 1 second
  Then I should receive a request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the payload field "events.0.exceptions.0.stacktrace.0.code" matches the JSON fixture in "features/fixtures/surrounding_code/scenarios/template.json"

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: loading surrouding code when sendCode=true
And I set environment variable "NODE_VERSION" to "<node version>"
And I have built the service "surrounding_code"
And I run the service "surrounding_code" with the command "node scenarios/send-code-on"
And I wait for 1 second
Then I should receive a request
And the request used the Node notifier
And the request used payload v4 headers
And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
And the payload field "events.0.exceptions.0.stacktrace.0.code" matches the JSON fixture in "features/fixtures/surrounding_code/scenarios/template.json"

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |

Scenario Outline: not loading surrouding code when sendCode=false
  And I set environment variable "NODE_VERSION" to "<node version>"
  And I have built the service "surrounding_code"
  And I run the service "surrounding_code" with the command "node scenarios/send-code-off"
  And I wait for 1 second
  Then I should receive 1 request
  And the request used the Node notifier
  And the request used payload v4 headers
  And the "bugsnag-api-key" header equals "9c2151b65d615a3a95ba408142c8698f"
  And the payload field "events.0.exceptions.0.stacktrace.0.code" is null

  Examples:
  | node version |
  | 4            |
  | 6            |
  | 8            |
