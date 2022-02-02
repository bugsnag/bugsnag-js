Feature: Metadata

Scenario: Setting metadata (JS)
  When I run "MetadataJsScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "MetadataJsScenario"
  And the event "metaData.jsdata.some_data" equals "set via config"
  And the event "metaData.jsdata.some_more_data" equals "set via client"
  And the event "metaData.jsdata.even_more_data" equals "set via event"
  And the event "metaData.jsdata.redacted_data" equals "[REDACTED]"
  And the event "metaData.jsdata.recursive.data" equals "some valid data"
  And the event "metaData.jsdata.recursive.circle" equals "[Circular]"
  And the error payload field "events.0.metaData.jsarraydata.items" is an array with 3 elements

Scenario: Setting metadata (native handled)
  When I run "MetadataNativeScenario"
  Then I wait to receive an error
  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the exception "message" equals "MetadataNativeScenario"
  And the event "metaData.nativedata.some_data" equals "set via config"
  And the event "metaData.nativedata.some_more_data" equals "set via client"
  And the event "metaData.nativedata.even_more_data" equals "set via event"
  And the event "metaData.nativedata.cleared_data" is null

Scenario: Setting metadata (native unhandled)
  When I run "MetadataNativeUnhandledScenario"
  And I wait for 2 seconds
  And I clear any error dialogue
  And I relaunch the app after a crash
  And I configure Bugsnag for "MetadataNativeUnhandledScenario"
  Then I wait to receive an error
  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the exception "message" equals "MetadataNativeUnhandledScenario"
  And the event "metaData.nativedata.some_data" equals "set via config"
  And the event "metaData.nativedata.some_more_data" equals "set via client"
  # Skipped on iOS as callbacks cannot be added outside of config
  And the event "metaData.nativedata.even_more_data" equals the platform-dependent string:
  | android | set via event |
  | ios     | @skip         |
  And the event "metaData.nativedata.cleared_data" is null
