Feature: Setting config options in renderers

    Scenario Outline: Setting config options in renderers
        Given I launch an app with configuration:
            | renderer_config | <config> |
        And I click "renderer-notify"
        Then the total requests received by the server matches:
            | events  | 1        |
        Then the headers of every event request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        Then the contents of an event request matches "renderer/config/<property>.json"

        Examples:
            | property | config                      |
            | appType  | { "appType": "real great" } |

    Scenario Outline: Setting codeBundleId in renderers
        Given I launch an app with configuration:
            | renderer_config | <config> |
        And I click "renderer-notify"
        Then the total requests received by the server matches:
            | events  | 1        |
        Then the headers of every event request contains:
            | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
            | Content-Type      | application/json                 |
            | Bugsnag-Integrity | {BODY_SHA1}                      |
        Then the contents of an event request matches "renderer/config/<property>.json"

        Examples:
            | property | config                      |
            | codeBundleId  | { "codeBundleId": "1.0.0-r0123" } |
