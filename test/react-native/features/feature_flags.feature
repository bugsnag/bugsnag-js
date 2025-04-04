Feature: Reporting with feature flags

Scenario: Sends handled exception which includes feature flags
  When I run "FeatureFlagsScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the event "unhandled" is false
  And event 0 contains the feature flag "demo_mode" with no variant
  And event 0 does not contain the feature flag "should_not_be_reported_1"
  And event 0 does not contain the feature flag "should_not_be_reported_2"
  And event 0 does not contain the feature flag "should_not_be_reported_3"

Scenario: Sends handled exception which includes feature flags added in the notify callback
  When I run "FeatureFlagsScenario" with data "callback"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the event "unhandled" is false
  And event 0 contains the feature flag "demo_mode" with no variant
  And event 0 contains the feature flag "sample_group" with variant "a"
  And event 0 does not contain the feature flag "should_not_be_reported_1"
  And event 0 does not contain the feature flag "should_not_be_reported_2"
  And event 0 does not contain the feature flag "should_not_be_reported_3"

# Skipped pending PLAT-14039
@skip_new_arch_ios
Scenario: Sends unhandled exception which includes feature flags added in the notify callback
  When I run "FeatureFlagsScenario" with data "unhandled callback" and relaunch the crashed app
  And I configure Bugsnag for "FeatureFlagsScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the event "unhandled" is true
  And event 0 contains the feature flag "demo_mode" with no variant
  And event 0 contains the feature flag "sample_group" with variant "a"
  And event 0 does not contain the feature flag "should_not_be_reported_1"
  And event 0 does not contain the feature flag "should_not_be_reported_2"
  And event 0 does not contain the feature flag "should_not_be_reported_3"

Scenario: Sends no feature flags after clearFeatureFlags()
  When I run "FeatureFlagsScenario" with data "cleared"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the event "unhandled" is false
  And event 0 has no feature flags

Scenario: Sends JS feature flags in a native crash
  When I run "FeatureFlagsNativeCrashScenario" and relaunch the crashed app
  And I configure Bugsnag for "FeatureFlagsNativeCrashScenario"
  Then I wait to receive an error
  And the event "unhandled" is true
  And the exception "message" matches "FeatureFlagsNativeCrashScenario"
  And event 0 contains the feature flag "demo_mode" with no variant
  And event 0 contains the feature flag "sample_group" with variant "a"
  And event 0 does not contain the feature flag "should_not_be_reported_1"
  And event 0 does not contain the feature flag "should_not_be_reported_2"
  And event 0 does not contain the feature flag "should_not_be_reported_3"

Scenario: Sends native feature flags in JS errors
  When I run "NativeFeatureFlagsScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the event "unhandled" is false
  And event 0 contains the feature flag "native_flag" with no variant
  And event 0 contains the feature flag "demo_mode" with no variant
  And event 0 contains the feature flag "sample_group" with variant "a"
  And event 0 does not contain the feature flag "should_not_be_reported_1"
  And event 0 does not contain the feature flag "should_not_be_reported_2"
  And event 0 does not contain the feature flag "should_not_be_reported_3"
