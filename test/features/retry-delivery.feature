Feature: Retrying failed requests

    Scenario: Retrying failed requests once connectivity is available
        Given the server is unreachable
        And I launch an app
        And the app lacks network connectivity
        When I click "custom-breadcrumb"
        And I click "main-notify"
        Then the total requests received by the server matches:
            | events   | 0 |
            | sessions | 0 |
        When the server becomes reachable
        And the app gains network connectivity
        Then the total requests received by the server matches:
            | events   | 1 |
            | sessions | 1 |
        Then the headers of every event request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        Then the headers of every session request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        And the contents of an event request matches "main/handled-error/default.json"
        And the contents of a session request matches "sessions/default.json"

    @not_windows
    Scenario: Retrying failed requests at launch
        Given the server is unreachable
        And I launch an app
        When I click "custom-breadcrumb"
        And I click "main-notify"
        Then the total requests received by the server matches:
            | events   | 0 |
            | sessions | 0 |
        When I close the app
        And the server becomes reachable
        And I launch an app
        Then the total requests received by the server matches:
            | events   | 1 |
            | sessions | 2 |
        Then the headers of every event request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        Then the headers of every session request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        And the contents of an event request matches "main/handled-error/default.json"
        And the contents of every session request matches "sessions/default.json"
