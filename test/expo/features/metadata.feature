Feature: Meta data

Background:
  Given the element "metaDataFeature" is present
  And I click the element "metaDataFeature"

Scenario: Meta data can be set via the client
  Given the element "metaDataClientButton" is present
  When I click the element "metaDataClientButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "MetaDataClientError"
  And the event "metaData.extra.reason" equals "metaDataClientName"

Scenario: Meta data can be set via a callback
  Given the element "metaDataCallbackButton" is present
  When I click the element "metaDataCallbackButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "MetaDataCallbackError"
  And the event "metaData.extra.reason" equals "metaDataCallbackName"

Scenario: Meta data can be set via handled options
  Given the element "metaDataOptsButton" is present
  When I click the element "metaDataOptsButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "MetaDataOptsError"
  And the event "metaData.extra.reason" equals "metaDataOptsName"