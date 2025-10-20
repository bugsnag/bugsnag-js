Feature: ReactNative ErrorBoundary support

Scenario: ErrorBoundary component reports errors
  When I run "ReactNativeErrorBoundaryScenario"
  And I relaunch the app after a crash
  And I configure Bugsnag for "ReactNativeErrorBoundaryScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "borked"
  And the event "metaData.react.componentStack" is not null
  And the event "metaData.errorBoundary.caughtByErrorBoundary" is true
  And the event "metaData.errorBoundary.handlerType" equals "react-native-error-boundary"