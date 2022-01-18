Feature: Overriding unhandled state

Scenario: Non-fatal error overridden to unhandled
    When I run "HandledOverrideJsErrorScenario"
    Then I wait to receive an error
    And I wait to receive a session

    Then the exception "message" equals "HandledOverrideJsErrorScenario"
    And the event "unhandled" is true
    And the event "severity" equals "warning"
    And the event "severityReason.type" equals "handledException"
    And the event "severityReason.unhandledOverridden" is true
    And the event "session.events.handled" equals 0
    And the event "session.events.unhandled" equals 1

Scenario: Fatal error overridden to handled
    When I run "UnhandledOverrideJsErrorScenario" and relaunch the crashed app
    And I configure Bugsnag for "UnhandledOverrideJsErrorScenario"
    Then I wait to receive an error
    And I wait to receive a session

    Then the exception "message" equals "UnhandledOverrideJsErrorScenario"
    And the event "unhandled" is false
    And the event "severity" equals "error"
    And the event "severityReason.type" equals "unhandledPromiseRejection"
    And the event "severityReason.unhandledOverridden" is true
    And the event "session.events.handled" equals 1
    And the event "session.events.unhandled" equals 0
