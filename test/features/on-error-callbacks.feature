Feature: OnError callbacks

    Scenario Outline: All callbacks run
        Given I launch an app with configuration:
            | bugsnag | <config> |
        When I click "renderer-notify-on-error"
        Then the total requests received by the server matches:
            | events  | 1        |
        Then the headers of every event request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        Then the contents of an event request matches "on-error/<config>.json"

        Examples:
            | config          |
            | default         |
            | complex-config  |