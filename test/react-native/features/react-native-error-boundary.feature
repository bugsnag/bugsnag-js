@react_error_boundary
Feature: React Error Boundary support

Scenario: basic error boundary usage
  When I run "ReactNativeErrorBoundaryScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "borked"
  And the event "metaData.react.componentStack" is not null