Feature: Feature flags

Scenario: feature flags are attached to unhandled errors in the main process
    Given I launch an app with configuration:
        | bugsnag         | feature-flags                                            |
        | renderer_config | { "featureFlags": [{ "name": "from renderer config" }] } |
    When I click "main-process-uncaught-exception"
    Then the total requests received by the server matches:
        | events   | 1        |
        | sessions | 1        |
    And the headers of every event request contains:
        | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
        | Content-Type      | application/json                 |
        | Bugsnag-Integrity | {BODY_SHA1}                      |
    And the event contains the following feature flags:
        | featureFlag              | variant    |
        | from main config 1       | 1234       |
        | from main config 2       |            |
        | from main at runtime     | runtime 1  |
        | from renderer config     |            |
        | from renderer at runtime | runtime    |
        | from main on error       | on error 1 |
    And the contents of an event request matches "main/uncaught-exception/default.json"

Scenario: feature flags are attached to handled errors in the main process
    Given I launch an app with configuration:
        | bugsnag         | feature-flags                                            |
        | renderer_config | { "featureFlags": [{ "name": "from renderer config" }] } |
    When I click "custom-breadcrumb"
    And I click "main-notify"
    Then the total requests received by the server matches:
        | events   | 1        |
        | sessions | 1        |
    And the headers of every event request contains:
        | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
        | Content-Type      | application/json                 |
        | Bugsnag-Integrity | {BODY_SHA1}                      |
    And the event contains the following feature flags:
        | featureFlag              | variant    |
        | from main config 1       | 1234       |
        | from main config 2       |            |
        | from main at runtime     | runtime 1  |
        | from renderer config     |            |
        | from renderer at runtime | runtime    |
        | from main on error       | on error 1 |
    And the contents of an event request matches "main/handled-error/default.json"

Scenario: feature flags can be cleared entirely in the main process with an unhandled error
    Given I launch an app with configuration:
        | bugsnag         | feature-flags                                            |
        | renderer_config | { "featureFlags": [{ "name": "from renderer config" }] } |
    When I click "main-process-clear-feature-flags"
    And I click "main-process-uncaught-exception"
    Then the total requests received by the server matches:
        | events   | 1        |
        | sessions | 1        |
    And the headers of every event request contains:
        | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
        | Content-Type      | application/json                 |
        | Bugsnag-Integrity | {BODY_SHA1}                      |
    And the event has no feature flags
    And the contents of an event request matches "main/uncaught-exception/default.json"

Scenario: feature flags can be cleared entirely in the main process with a handled error
    Given I launch an app with configuration:
        | bugsnag         | feature-flags                                            |
        | renderer_config | { "featureFlags": [{ "name": "from renderer config" }] } |
    When I click "main-process-clear-feature-flags"
    And I click "custom-breadcrumb"
    And I click "main-notify"
    Then the total requests received by the server matches:
        | events   | 1        |
        | sessions | 1        |
    And the headers of every event request contains:
        | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
        | Content-Type      | application/json                 |
        | Bugsnag-Integrity | {BODY_SHA1}                      |
    And the event has no feature flags
    And the contents of an event request matches "main/handled-error/default.json"
