Feature: Sessions are reported correctly in lambda functions

Scenario Outline: sessions are reported
    Given I setup the environment
    When I invoke the "<lambda>" lambda in "features/fixtures/simple-app" with the "events/<type>/handled-exception.json" event
    And I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp
    When I wait to receive an error
    Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
    And the event "session.events.handled" equals <handled-count>
    And the event "session.events.unhandled" equals <unhandled-count>

    Examples:
        | lambda                                   | type     | handled-count | unhandled-count |
        | AsyncUnhandledExceptionFunctionNode14    | async    | 0             | 1               |
        | AsyncUnhandledExceptionFunctionNode12    | async    | 0             | 1               |
        | CallbackUnhandledExceptionFunctionNode14 | callback | 0             | 1               |
        | CallbackUnhandledExceptionFunctionNode12 | callback | 0             | 1               |
        | AsyncHandledExceptionFunctionNode14      | async    | 1             | 0               |
        | AsyncHandledExceptionFunctionNode12      | async    | 1             | 0               |
        | CallbackHandledExceptionFunctionNode14   | callback | 1             | 0               |
        | CallbackHandledExceptionFunctionNode12   | callback | 1             | 0               |

Scenario Outline: no session is sent when autoTrackSessions is false
    Given I setup the environment
    And I set environment variable "BUGSNAG_AUTO_TRACK_SESSIONS" to "false"
    When I invoke the "<lambda>" lambda in "features/fixtures/simple-app" with the "events/<type>/handled-exception.json" event
    Then I should receive no sessions
    When I wait to receive an error
    Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier

    Examples:
        | lambda                                   | type     |
        | AsyncUnhandledExceptionFunctionNode14    | async    |
        | AsyncUnhandledExceptionFunctionNode12    | async    |
        | CallbackUnhandledExceptionFunctionNode14 | callback |
        | CallbackUnhandledExceptionFunctionNode12 | callback |
        | AsyncHandledExceptionFunctionNode14      | async    |
        | AsyncHandledExceptionFunctionNode12      | async    |
        | CallbackHandledExceptionFunctionNode14   | callback |
        | CallbackHandledExceptionFunctionNode12   | callback |
