@unhandled
Feature: Feature flags

Scenario: feature flags are attached to unhandled errors
  When I navigate to the test URL "/feature_flags/script/unhandled_error.html"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And event 0 is unhandled
  And the event contains the following feature flags:
    | featureFlag            | variant    |
    | from config 1          | 1234       |
    | from config 2          |            |
    | added at runtime 1     |            |
    | added at runtime 2     | runtime_2  |
    | added at runtime 4     |            |
    | from global on error 1 | on error 1 |
    | from global on error 2 |            |
    | from global on error 3 | 111        |

Scenario: feature flags are attached to handled errors
  When I navigate to the test URL "/feature_flags/script/handled_error.html"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And event 0 is handled
  And the event contains the following feature flags:
    | featureFlag            | variant        |
    | from config 1          | 1234           |
    | from config 2          |                |
    | added at runtime 1     |                |
    | added at runtime 2     | runtime_2      |
    | added at runtime 4     |                |
    | from global on error 1 | on error 1     |
    | from global on error 3 | 111            |
    | from notify on error   | notify 7636390 |

Scenario: feature flags can be cleared entirely with an unhandled error
  When I navigate to the test URL "/feature_flags/script/unhandled_error.html?clear_all_flags"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And event 0 is unhandled
  And the event has no feature flags

Scenario: feature flags can be cleared entirely with a handled error
  When I navigate to the test URL "/feature_flags/script/handled_error.html?clear_all_flags"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And event 0 is handled
  And the event has no feature flags
