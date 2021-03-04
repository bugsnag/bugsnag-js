Feature: Sessions are reported correctly in lambda functions

@simple-app
Scenario Outline: sessions are reported
    Given I setup the environment
    When I invoke the "<lambda>" lambda in "features/fixtures/simple-app"
    And I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp
    When I wait to receive an error
    Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier
    And the event "session.events.handled" equals <handled-count>
    And the event "session.events.unhandled" equals <unhandled-count>

    Examples:
        | lambda                                         | handled-count | unhandled-count |
        | AsyncUnhandledExceptionFunctionNode14          | 0             | 1               |
        | AsyncUnhandledExceptionFunctionNode12          | 0             | 1               |
        | CallbackUnhandledExceptionFunctionNode14       | 0             | 1               |
        | CallbackUnhandledExceptionFunctionNode12       | 0             | 1               |
        | CallbackThrownUnhandledExceptionFunctionNode14 | 0             | 1               |
        | CallbackThrownUnhandledExceptionFunctionNode12 | 0             | 1               |
        | AsyncHandledExceptionFunctionNode14            | 1             | 0               |
        | AsyncHandledExceptionFunctionNode12            | 1             | 0               |
        | CallbackHandledExceptionFunctionNode14         | 1             | 0               |
        | CallbackHandledExceptionFunctionNode12         | 1             | 0               |

@simple-app
Scenario Outline: no session is sent when autoTrackSessions is false
    Given I setup the environment
    And I set environment variable "BUGSNAG_AUTO_TRACK_SESSIONS" to "false"
    When I invoke the "<lambda>" lambda in "features/fixtures/simple-app"
    Then I should receive no sessions
    When I wait to receive an error
    Then the error is valid for the error reporting API version "4" for the "Bugsnag Node" notifier

    Examples:
        | lambda                                   |
        | AsyncUnhandledExceptionFunctionNode14    |
        | AsyncUnhandledExceptionFunctionNode12    |
        | CallbackUnhandledExceptionFunctionNode14 |
        | CallbackUnhandledExceptionFunctionNode12 |
        | AsyncHandledExceptionFunctionNode14      |
        | AsyncHandledExceptionFunctionNode12      |
        | CallbackHandledExceptionFunctionNode14   |
        | CallbackHandledExceptionFunctionNode12   |
