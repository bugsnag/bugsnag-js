Feature: Metadata

Scenario: Setting metadata (JS)
  When I run "MetadataJsScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "MetadataJsScenario"
  And the event "metaData.jsdata.some_data" equals "set via config"
  And the event "metaData.jsdata.some_more_data" equals "set via client"
  And the event "metaData.jsdata.even_more_data" equals "set via event"

Scenario: Setting metadata (native)
  When I run "MetadataNativeScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "java.lang.RuntimeException"
  And the exception "message" equals "MetadataNativeScenario"
  # And the event "metaData.nativedata.some_data" equals "set via config"
  And the event "metaData.nativedata.some_more_data" equals "set via client"
  And the event "metaData.nativedata.even_more_data" equals "set via event"
