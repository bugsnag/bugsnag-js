Feature: Feature flags

Background:
  Given the element "featureFlags" is present
  And I click the element "featureFlags"

Scenario: feature flags are attached to unhandled errors
  Given the element "unhandledErrorWithFeatureFlagsButton" is present
  When I click the element "unhandledErrorWithFeatureFlagsButton"
  Then I wait to receive an error
  And the error is valid for the error reporting API version "4" for the "Bugsnag Expo" notifier with the apiKey "645470b8c7f62177e1a723e26c9a48d7"
  And event 0 is unhandled
  And the event contains the following feature flags:
    | featureFlag            | variant        |
    | added at runtime 1     |                |
    | added at runtime 2     | runtime_2      |
    | added at runtime 4     |                |
    | from global on error 1 | on error 1     |
    | from global on error 2 |                |
    | from global on error 3 | 111            |

Scenario: feature flags are attached to handled errors
  Given the element "handledErrorWithFeatureFlagsButton" is present
  When I click the element "handledErrorWithFeatureFlagsButton"
  Then I wait to receive an error
  And the error is valid for the error reporting API version "4" for the "Bugsnag Expo" notifier with the apiKey "645470b8c7f62177e1a723e26c9a48d7"
  And event 0 is handled
  And the event contains the following feature flags:
    | featureFlag            | variant        |
    | added at runtime 1     |                |
    | added at runtime 2     | runtime_2      |
    | added at runtime 4     |                |
    | from global on error 1 | on error 1     |
    | from global on error 3 | 111            |
    | from notify on error   | notify 7636390 |

Scenario: feature flags can be cleared entirely with an unhandled error
  Given the element "unhandledErrorClearFeatureFlagsButton" is present
  When I click the element "unhandledErrorClearFeatureFlagsButton"
  Then I wait to receive an error
  And the error is valid for the error reporting API version "4" for the "Bugsnag Expo" notifier with the apiKey "645470b8c7f62177e1a723e26c9a48d7"
  And event 0 is unhandled
  And the event has no feature flags

Scenario: feature flags can be cleared entirely with a handled error
  Given the element "handledErrorClearFeatureFlagsButton" is present
  When I click the element "handledErrorClearFeatureFlagsButton"
  Then I wait to receive an error
  And the error is valid for the error reporting API version "4" for the "Bugsnag Expo" notifier with the apiKey "645470b8c7f62177e1a723e26c9a48d7"
  And event 0 is handled
  And the event has no feature flags
