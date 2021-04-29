Feature: Startup performance

    Scenario Outline: Notifier starts in a reasonable time frame
        Given I launch an app with configuration:
            | bugsnag | <config> |
        And I click "performance-metrics"
        Then the total requests received by the server matches:
            | events  | 1        |
        Then the headers of every event request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        Then the event metadata "performance.startupTime" is less than 150

        Examples:
            | config          |
            | default         |
            | complex-config  |
