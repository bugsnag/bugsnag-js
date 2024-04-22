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
            | codeBundleId  | { "codeBundleId": "1.0.0-r0123" } |
            | user  | { "user": { "id": "3", "name": "Bugs Nag", "email": "bugs.nag@bugsnag.com" } } |
            | context  | { "context": "renderer context" } |
            | metadata  | { "metadata": { "renderer": { "key": "value" } } } |

    Scenario Outline: Clearing config options set in renderer config
        Given I launch an app with configuration:
            | renderer_config | <config> |
        When I click "renderer-<property>"
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
            | clear-user  | { "user": { "id": "3", "name": "Bugs Nag", "email": "bugs.nag@bugsnag.com" } } |
            | clear-context  | { "context": "renderer context" } |
            | clear-metadata  | { "metadata": { "renderer": { "key": "value" } } } |