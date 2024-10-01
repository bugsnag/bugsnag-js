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
        | AsyncUnhandledExceptionFunctionNode18          | 0             | 1               |
        | CallbackUnhandledExceptionFunctionNode18       | 0             | 1               |
        | CallbackThrownUnhandledExceptionFunctionNode18 | 0             | 1               |
        | AsyncHandledExceptionFunctionNode18            | 1             | 0               |
        | CallbackHandledExceptionFunctionNode18         | 1             | 0               |

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
        | AsyncUnhandledExceptionFunctionNode18    |
        | CallbackUnhandledExceptionFunctionNode18 |
        | AsyncHandledExceptionFunctionNode18      |
        | CallbackHandledExceptionFunctionNode18   |
