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

    Scenario: Breadcrumbs can be cancelled in renderer and not synced to main
        Given I launch an app with configuration:
            | bugsnag | default |
        When I click "custom-breadcrumb"
        And I click "renderer-cancel-breadcrumbs"
        And I click "custom-breadcrumb"
        And I click "custom-breadcrumb"
        And I click "main-process-uncaught-exception"
        Then the total requests received by the server matches:
            | events   | 1        |
            | sessions | 1        |
        And the headers of every event request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        And the contents of an event request matches "main/breadcrumbs/cancelled.json"
        And exactly 1 breadcrumb in event request 0 matches:
            | type | manual             |
            | name | missing auth token |
