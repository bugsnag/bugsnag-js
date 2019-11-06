Feature: Metadata

Background:
  Given the element "metadataFeature" is present
  And I click the element "metadataFeature"

Scenario: Metadata can be set via the client
  Given the element "metadataClientButton" is present
  When I click the element "metadataClientButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "MetadataClientError"
  And the event "metaData.extra.reason" equals "metadataClientName"

Scenario: Metadata can be set via a callback
  Given the element "metadataCallbackButton" is present
  When I click the element "metadataCallbackButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "MetadataCallbackError"
  And the event "metaData.extra.reason" equals "metadataCallbackName"
