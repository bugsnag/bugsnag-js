Feature: Reporting sessions
    Scenario Outline: a session is sent on load
        Given I launch an app with configuration:
            | bugsnag | <config> |
        Then the total requests received by the server matches:
            | events   | 0        |
            | sessions | 1        |
        And the headers of every session request contains:
            | Bugsnag-API-Key   | 100a2272bd2b0ac0ab0f52715bbdc659 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        And the contents of a session request matches "sessions/<config>.json"

    Examples:
        | config         |
        | default        |
        | complex-config |

    Scenario: no session is sent on load when autoTrackSessions is disabled
        When I launch an app with configuration:
            | bugsnag | disable-session-tracking |
        Then the total requests received by the server matches:
            | events   | 0        |
            | sessions | 0        |

    Scenario: a session can be started manually in the main process
        Given I launch an app with configuration:
            | bugsnag | <config> |
        Then the total requests received by the server matches:
            | events   | 0        |
            | sessions | 1        |
        When I click "main-process-start-session"
        Then the total requests received by the server matches:
            | events   | 0        |
            | sessions | 2        |
        And the headers of every session request contains:
            | Bugsnag-API-Key   | 100a2272bd2b0ac0ab0f52715bbdc659 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        And the contents of session request 0 matches "sessions/<config>.json"
        And the contents of session request 1 matches "sessions/<config>.json"

    Examples:
        | config         |
        | default        |
        | complex-config |

    Scenario: a session can be started manually in the main process with autoTrackSessions disabled
        When I launch an app with configuration:
            | bugsnag | disable-session-tracking |
        Then the total requests received by the server matches:
            | events   | 0        |
            | sessions | 0        |
        When I click "main-process-start-session"
        Then the total requests received by the server matches:
            | events   | 0        |
            | sessions | 1        |
        And the headers of every event request contains:
            | Bugsnag-API-Key   | 100a2272bd2b0ac0ab0f52715bbdc659 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        And the contents of a session request matches "sessions/default.json"
