Feature: Sessions are reported correctly in lambda functions

Scenario Outline: sessions are reported
    Given I setup the environment
    When I invoke the "<lambda>" lambda in "features/fixtures/simple-app" with the "events/<type>/handled-exception.json" event
    And I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp

    Examples:
        | lambda                                   | type     |
        | AsyncUnhandledExceptionFunctionNode14    | async    |
        | AsyncUnhandledExceptionFunctionNode12    | async    |
        | CallbackUnhandledExceptionFunctionNode14 | callback |
        | CallbackUnhandledExceptionFunctionNode12 | callback |

Scenario Outline: no session is sent when autoTrackSessions is false
    Given I setup the environment
    And I set environment variable "BUGSNAG_AUTO_TRACK_SESSIONS" to "false"
    When I invoke the "<lambda>" lambda in "features/fixtures/simple-app" with the "events/<type>/handled-exception.json" event
    Then I should receive no sessions

    Examples:
        | lambda                                   | type     |
        | AsyncUnhandledExceptionFunctionNode14    | async    |
        | AsyncUnhandledExceptionFunctionNode12    | async    |
        | CallbackUnhandledExceptionFunctionNode14 | callback |
        | CallbackUnhandledExceptionFunctionNode12 | callback |
