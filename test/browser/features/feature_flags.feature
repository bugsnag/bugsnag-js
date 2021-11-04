@unhandled
Feature: Feature flags

Scenario: feature flags are attached to unhandled errors
  When I navigate to the test URL "/feature_flags/script/unhandled_error.html"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And event 0 is unhandled
  And the error payload field "events.0.featureFlags" is an array with 8 elements
  And the event "featureFlags.0.featureFlag" equals "from config 1"
  And the event "featureFlags.0.variant" equals "1234"
  And the event "featureFlags.1.featureFlag" equals "from config 2"
  And the event "featureFlags.1" has no variant
  And the event "featureFlags.2.featureFlag" equals "added at runtime 1"
  And the event "featureFlags.2" has no variant
  And the event "featureFlags.3.featureFlag" equals "added at runtime 2"
  And the event "featureFlags.3.variant" equals "runtime_2"
  And the event "featureFlags.4.featureFlag" equals "added at runtime 4"
  And the event "featureFlags.4" has no variant
  And the event "featureFlags.5.featureFlag" equals "from global on error 1"
  And the event "featureFlags.5.variant" equals "on error 1"
  And the event "featureFlags.6.featureFlag" equals "from global on error 2"
  And the event "featureFlags.6" has no variant
  And the event "featureFlags.7.featureFlag" equals "from global on error 3"
  And the event "featureFlags.7.variant" equals "111"

Scenario: feature flags are attached to handled errors
  When I navigate to the test URL "/feature_flags/script/handled_error.html"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And event 0 is handled
  And the error payload field "events.0.featureFlags" is an array with 8 elements
  And the event "featureFlags.0.featureFlag" equals "from config 1"
  And the event "featureFlags.0.variant" equals "1234"
  And the event "featureFlags.1.featureFlag" equals "from config 2"
  And the event "featureFlags.1" has no variant
  And the event "featureFlags.2.featureFlag" equals "added at runtime 1"
  And the event "featureFlags.2" has no variant
  And the event "featureFlags.3.featureFlag" equals "added at runtime 2"
  And the event "featureFlags.3.variant" equals "runtime_2"
  And the event "featureFlags.4.featureFlag" equals "added at runtime 4"
  And the event "featureFlags.4" has no variant
  And the event "featureFlags.5.featureFlag" equals "from global on error 1"
  And the event "featureFlags.5.variant" equals "on error 1"
  And the event "featureFlags.6.featureFlag" equals "from global on error 3"
  And the event "featureFlags.6.variant" equals "111"
  And the event "featureFlags.7.featureFlag" equals "from notify on error"
  And the event "featureFlags.7.variant" equals "notify 7636390"

Scenario: feature flags can be cleared entirely with an unhandled error
  When I navigate to the test URL "/feature_flags/script/unhandled_error.html?clear_all_flags"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And event 0 is unhandled
  And the error payload field "events.0.featureFlags" is an array with 0 elements

Scenario: feature flags can be cleared entirely with a handled error
  When I navigate to the test URL "/feature_flags/script/handled_error.html?clear_all_flags"
  Then I wait to receive an error
  And the error is a valid browser payload for the error reporting API
  And event 0 is handled
  And the error payload field "events.0.featureFlags" is an array with 0 elements
