Feature: Automatic context

    Scenario Outline: Automatic config in renderers
        Given I launch an app with configuration:
            | bugsnag | <config> |
        And I click "<case>"
        And I click "renderer-notify"
        Then the total requests received by the server matches:
            | events  | 1        |
        Then the headers of every event request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        Then the contents of an event request matches "renderer/context/<case>-<config>.json"

        Examples:
            | config         | case               |
            | default        | page-title-clear   |
            | default        | page-title-update  |
            | default        | set-context        |
            | complex-config | page-title-clear   |
            | complex-config | page-title-update  |