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
        | featureFlag                | variant    |
        | from main config 1         | 1234       |
        | from main config 2         |            |
        | from main at runtime       | runtime 1  |
        | from renderer config       |            |
        | from renderer at runtime 1 | runtime    |
        | from renderer at runtime 2 |            |
        | from main on error         | on error 1 |
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
        | featureFlag                | variant    |
        | from main config 1         | 1234       |
        | from main config 2         |            |
        | from main at runtime       | runtime 1  |
        | from renderer config       |            |
        | from renderer at runtime 1 | runtime    |
        | from renderer at runtime 2 |            |
        | from main on error         | on error 1 |
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

Scenario: feature flags are attached to unhandled errors in a renderer process
    Given I launch an app with configuration:
        | bugsnag         | feature-flags                                            |
        | renderer_config | { "featureFlags": [{ "name": "from renderer config" }] } |
    When I click "renderer-uncaught-exception"
    Then the total requests received by the server matches:
        | events   | 1        |
        | sessions | 1        |
    And the headers of every event request contains:
        | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
        | Content-Type      | application/json                 |
        | Bugsnag-Integrity | {BODY_SHA1}                      |
    And the event contains the following feature flags:
        | featureFlag                | variant    |
        | from main config 1         | 1234       |
        | from main config 2         |            |
        | from main at runtime       | runtime 1  |
        | from renderer config       |            |
        | from renderer at runtime 1 | runtime    |
        | from renderer at runtime 2 |            |
        | from renderer on error     | on error   |
        | from main on error         | on error 1 |
    And the contents of an event request matches "renderer/uncaught-exception/default.json"

Scenario: feature flags are attached to handled errors in a renderer process
    Given I launch an app with configuration:
        | bugsnag         | feature-flags                                            |
        | renderer_config | { "featureFlags": [{ "name": "from renderer config" }] } |
    When I click "custom-breadcrumb"
    And I click "renderer-notify"
    Then the total requests received by the server matches:
        | events   | 1        |
        | sessions | 1        |
    And the headers of every event request contains:
        | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
        | Content-Type      | application/json                 |
        | Bugsnag-Integrity | {BODY_SHA1}                      |
    And the event contains the following feature flags:
        | featureFlag                | variant    |
        | from main config 1         | 1234       |
        | from main config 2         |            |
        | from main at runtime       | runtime 1  |
        | from renderer config       |            |
        | from renderer at runtime 1 | runtime    |
        | from renderer at runtime 2 |            |
        | from renderer on error     | on error   |
        | from main on error         | on error 1 |
    And the contents of an event request matches "renderer/handled-error/default.json"

Scenario: feature flags can be cleared entirely in a renderer process with an unhandled error
    Given I launch an app with configuration:
        | bugsnag         | feature-flags                                            |
        | renderer_config | { "featureFlags": [{ "name": "from renderer config" }] } |
    When I click "renderer-clear-feature-flags-now"
    And I click "renderer-uncaught-exception"
    Then the total requests received by the server matches:
        | events   | 1        |
        | sessions | 1        |
    And the headers of every event request contains:
        | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
        | Content-Type      | application/json                 |
        | Bugsnag-Integrity | {BODY_SHA1}                      |
    # the renderer and main process on error callbacks each add a feature flag after
    # the flags are cleared, so there are still two feature flags present
    And the event contains the following feature flags:
        | featureFlag            | variant    |
        | from renderer on error | on error   |
        | from main on error     | on error 1 |
    And the contents of an event request matches "renderer/uncaught-exception/default.json"

Scenario: feature flags can be cleared entirely in a renderer process with a handled error
    Given I launch an app with configuration:
        | bugsnag         | feature-flags                                            |
        | renderer_config | { "featureFlags": [{ "name": "from renderer config" }] } |
    When I click "renderer-clear-feature-flags-now"
    And I click "custom-breadcrumb"
    And I click "renderer-notify"
    Then the total requests received by the server matches:
        | events   | 1        |
        | sessions | 1        |
    And the headers of every event request contains:
        | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
        | Content-Type      | application/json                 |
        | Bugsnag-Integrity | {BODY_SHA1}                      |
    # the renderer and main process on error callbacks each add a feature flag after
    # the flags are cleared, so there are still two feature flags present
    And the event contains the following feature flags:
        | featureFlag            | variant    |
        | from renderer on error | on error   |
        | from main on error     | on error 1 |
    And the contents of an event request matches "renderer/handled-error/default.json"

Scenario: feature flags can be cleared entirely via a callback in a renderer process with an unhandled error
    Given I launch an app with configuration:
        | bugsnag         | feature-flags                                            |
        | renderer_config | { "featureFlags": [{ "name": "from renderer config" }] } |
    When I click "renderer-clear-feature-flags"
    And I click "renderer-uncaught-exception"
    Then the total requests received by the server matches:
        | events   | 1        |
        | sessions | 1        |
    And the headers of every event request contains:
        | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
        | Content-Type      | application/json                 |
        | Bugsnag-Integrity | {BODY_SHA1}                      |
    # the main process on error callbacks run after the renderer process callbacks,
    # so there is still a single feature flag present because it's added after
    # the flags are cleared
    And the event contains the following feature flags:
        | featureFlag        | variant    |
        | from main on error | on error 1 |
    And the contents of an event request matches "renderer/uncaught-exception/default.json"

Scenario: feature flags can be cleared entirely via a callback in a renderer process with a handled error
    Given I launch an app with configuration:
        | bugsnag         | feature-flags                                            |
        | renderer_config | { "featureFlags": [{ "name": "from renderer config" }] } |
    When I click "renderer-clear-feature-flags"
    And I click "custom-breadcrumb"
    And I click "renderer-notify"
    Then the total requests received by the server matches:
        | events   | 1        |
        | sessions | 1        |
    And the headers of every event request contains:
        | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
        | Content-Type      | application/json                 |
        | Bugsnag-Integrity | {BODY_SHA1}                      |
    # the main process on error callbacks run after the renderer process callbacks,
    # so there is still a single feature flag present because it's added after
    # the flags are cleared
    And the event contains the following feature flags:
        | featureFlag        | variant    |
        | from main on error | on error 1 |
    And the contents of an event request matches "renderer/handled-error/default.json"

Scenario: feature flags are attached to native crashes from the main process
    Given I launch an app with configuration:
        | bugsnag         | feature-flags                                            |
        | renderer_config | { "featureFlags": [{ "name": "from renderer config" }] } |
    Then the total requests received by the server matches:
        | events    | 0 |
        | minidumps | 0 |
        | sessions  | 1 |
    When I click "main-process-crash"
    And I launch an app
    Then the total requests received by the server matches:
        | events    | 0 |
        | minidumps | 1 |
        | sessions  | 2 |
    And minidump request 0 contains the following feature flags:
        | featureFlag                | variant   |
        | from main config 1         | 1234      |
        | from main config 2         |           |
        | from main at runtime       | runtime 1 |
        | from renderer config       |           |
        | from renderer at runtime 1 | runtime   |
        | from renderer at runtime 2 |           |
    And minidump request 0 contains a file form field named "upload_file_minidump"
    And minidump request 0 contains a form field named "event" matching "minidump-event.json"

Scenario: feature flags can be cleared entirely in the main process with a native crash
    Given I launch an app with configuration:
        | bugsnag         | feature-flags                                            |
        | renderer_config | { "featureFlags": [{ "name": "from renderer config" }] } |
    Then the total requests received by the server matches:
        | events    | 0 |
        | minidumps | 0 |
        | sessions  | 1 |
    When I click "main-process-clear-feature-flags-now"
    And I click "main-process-crash"
    And I launch an app
    Then the total requests received by the server matches:
        | events    | 0 |
        | minidumps | 1 |
        | sessions  | 2 |
    And the headers of every event request contains:
        | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
        | Content-Type      | application/json                 |
        | Bugsnag-Integrity | {BODY_SHA1}                      |
    And minidump request 0 has no feature flags
    And minidump request 0 contains a file form field named "upload_file_minidump"
    And minidump request 0 contains a form field named "event" matching "minidump-event.json"

Scenario: feature flags are attached to native crashes from a renderer process
    Given I launch an app with configuration:
        | bugsnag         | feature-flags                                            |
        | renderer_config | { "featureFlags": [{ "name": "from renderer config" }] } |
    Then the total requests received by the server matches:
        | events    | 0 |
        | minidumps | 0 |
        | sessions  | 1 |
    When I click "renderer-process-crash"
    Then the total requests received by the server matches:
        | events    | 0 |
        | minidumps | 1 |
        | sessions  | 1 |
    And minidump request 0 contains the following feature flags:
        | featureFlag                | variant   |
        | from main config 1         | 1234      |
        | from main config 2         |           |
        | from main at runtime       | runtime 1 |
        | from renderer config       |           |
        | from renderer at runtime 1 | runtime   |
        | from renderer at runtime 2 |           |
    And minidump request 0 contains a file form field named "upload_file_minidump"
    And minidump request 0 contains a form field named "event" matching "minidump-event.json"

Scenario: feature flags can be cleared entirely in a renderer process with a native crash
    Given I launch an app with configuration:
        | bugsnag         | feature-flags                                            |
        | renderer_config | { "featureFlags": [{ "name": "from renderer config" }] } |
    Then the total requests received by the server matches:
        | events    | 0 |
        | minidumps | 0 |
        | sessions  | 1 |
    When I click "renderer-clear-feature-flags-now"
    And I click "renderer-process-crash"
    And I launch an app
    Then the total requests received by the server matches:
        | events    | 0 |
        | minidumps | 1 |
        | sessions  | 2 |
    And the headers of every event request contains:
        | Bugsnag-API-Key   | 6425093c6530f554a9897d2d7d38e248 |
        | Content-Type      | application/json                 |
        | Bugsnag-Integrity | {BODY_SHA1}                      |
    And minidump request 0 has no feature flags
    And minidump request 0 contains a file form field named "upload_file_minidump"
    And minidump request 0 contains a form field named "event" matching "minidump-event.json"
