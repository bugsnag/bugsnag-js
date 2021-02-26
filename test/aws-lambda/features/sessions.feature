Feature: Sessions are reported correctly in lambda functions

Scenario: session in an async lambda
    Given I setup the environment
    When I invoke the "AsyncHandledExceptionFunction" lambda in "features/fixtures/simple-app" with the "events/async/handled-exception.json" event
    And I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp

Scenario: session in a callback lambda
    Given I setup the environment
    When I invoke the "CallbackHandledExceptionFunction" lambda in "features/fixtures/simple-app" with the "events/callback/handled-exception.json" event
    And I wait to receive a session
    Then the session is valid for the session reporting API version "1" for the "Bugsnag Node" notifier
    And the session "id" is not null
    And the session "startedAt" is a timestamp

Scenario: no session is sent when autoTrackSessions is false in an async lambda
    Given I setup the environment
    And I set environment variable "BUGSNAG_AUTO_TRACK_SESSIONS" to "false"
    When I invoke the "AsyncHandledExceptionFunction" lambda in "features/fixtures/simple-app" with the "events/async/handled-exception.json" event
    Then I should receive no sessions

Scenario: no session is sent when autoTrackSessions is false in a callback lambda
    Given I setup the environment
    And I set environment variable "BUGSNAG_AUTO_TRACK_SESSIONS" to "false"
    When I invoke the "CallbackHandledExceptionFunction" lambda in "features/fixtures/simple-app" with the "events/callback/handled-exception.json" event
    Then I should receive no sessions
