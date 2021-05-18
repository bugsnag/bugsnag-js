Feature: App launch logic

    Scenario Outline: Automatic app launch threshold
        Given I launch an app with configuration:
            | bugsnag | <config> |
        And I click "main-process-uncaught-exception"
        Then the total requests received by the server matches:
            | events   | 1        |
            | sessions | 1        |
        Then the headers of every event request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        Then the contents of an event request matches "app-launch/<config>.json"

        Examples:
            | config          |
            | default         |
            | complex-config  |

    Scenario: Manual app launch threshold
        Given I launch an app with configuration:
            | bugsnag | zero-launch-duration |
        And I click "main-process-uncaught-exception"
        Then the total requests received by the server matches:
            | events   | 1        |
            | sessions | 1        |
        Then the headers of every event request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        Then the contents of an event request matches "app-launch/launch-incomplete.json"

    Scenario: Manual app launch threshold
        Given I launch an app with configuration:
            | bugsnag | zero-launch-duration |
        And I click "mark-launch-complete"
        And I click "main-process-uncaught-exception"
        Then the total requests received by the server matches:
            | events   | 1        |
            | sessions | 1        |
        Then the headers of every event request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        Then the contents of an event request matches "app-launch/launch-complete.json"