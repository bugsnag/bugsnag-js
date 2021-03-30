Feature: Automatic breadcrumbs

    Scenario Outline: Breadcrumbs for network requests and console.log
        Given I launch an app with configuration:
            | bugsnag | <config> |
        When I click "main-process-console-log"
        And I click "renderer-process-console-log"
        And I click "main-process-uncaught-exception"
        Then the total requests received by the server matches:
            | events   | 1        |
            | sessions | 1        |
        Then the headers of every event request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        Then the contents of an event request matches "main/breadcrumbs/<config>.json"

        Examples:
            | config          |
            | default         |
            | complex-config  |
