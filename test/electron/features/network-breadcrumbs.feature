Feature: Automatic breadcrumbs for network requests

    Scenario Outline: Breadcrumbs for network requests
        Given I launch an app with configuration:
            | bugsnag | network-breadcrumbs |
        When I click "main-process-request-<request>"
        Then the total requests received by the server matches:
            | events   | 1        |
            | sessions | 1        |
        Then the headers of every event request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        Then the contents of an event request matches "main/breadcrumbs/network/<request>.json"

        Examples:
            | request           |
            | get-success       |
            | get-failure       |
            