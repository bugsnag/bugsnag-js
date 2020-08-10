Feature: Metadata

Scenario: Setting metadata (JS)
  When I run "MetadataJsScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "MetadataJsScenario"
  And the event "metaData.jsdata.some_data" equals "set via config"
  And the event "metaData.jsdata.some_more_data" equals "set via client"
  And the event "metaData.jsdata.even_more_data" equals "set via event"
  And the payload field "events.0.metaData.jsarraydata.items" is an array with 3 elements

Scenario: Setting metadata (native handled)
  When I run "MetadataNativeScenario"
  Then I wait to receive a request
  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the exception "message" equals "MetadataNativeScenario"
  And the event "metaData.nativedata.some_data" equals "set via config"
  And the event "metaData.nativedata.some_more_data" equals "set via client"
  And the event "metaData.nativedata.even_more_data" equals "set via event"

Scenario: Setting metadata (native unhandled)
  When I run "MetadataNativeUnhandledScenario" and relaunch the app
  And I configure Bugsnag for "MetadataNativeUnhandledScenario"
  Then I wait to receive a request
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
