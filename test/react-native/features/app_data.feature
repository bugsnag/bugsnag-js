Feature: App data

Scenario: Handled JS error
  When I run "AppJsHandledScenario" and relaunch the app
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "HandledCaughtError"
  And the event "app.version" equals "1.2.3"
  And the event "app.versionCode" equals 1
  And the event "app.releaseStage" equals "production"
  And the event "app.inForeground" is true
  And the event "app.duration" is not null
  And the event "app.durationInForeground" is not null

  # Android
  And the event "app.id" equals "com.reactnative"
  And the event "app.type" equals "android"
  # iOS
  # And the event "app.id" equals "org.reactjs.native.example.reactnative"
  # And the event "app.type" equals "ios"


Scenario: Unhandled JS error
  When I run "AppJsUnhandledScenario" and relaunch the app
  And I configure Bugsnag for "AppJsUnhandledScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "UnhandledError"
  And the event "app.version" equals "1.2.3"
  And the event "app.versionCode" equals 1
  And the event "app.releaseStage" equals "production"
  And the event "app.inForeground" is true
  And the event "app.duration" is not null
  And the event "app.durationInForeground" is not null

  # Android
  And the event "app.id" equals "com.reactnative"
  And the event "app.type" equals "android"
  # iOS
  # And the event "app.id" equals "org.reactjs.native.example.reactnative"
  # And the event "app.type" equals "ios"

Scenario: Handled native error
  When I run "AppNativeHandledScenario" and relaunch the app
  And I configure Bugsnag for "AppNativeHandledScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "java.lang.RuntimeException"
  And the exception "message" equals "AppNativeHandledScenario"
  And the event "app.version" equals "1.2.3"
  And the event "app.versionCode" equals 1
  And the event "app.releaseStage" equals "production"
  And the event "app.inForeground" is true
  And the event "app.duration" is not null
  And the event "app.durationInForeground" is not null

  # Android
  And the event "app.id" equals "com.reactnative"
  And the event "app.type" equals "android"
  # iOS
  # And the event "app.id" equals "org.reactjs.native.example.reactnative"
  # And the event "app.type" equals "ios"

Scenario: Unhandled native error
  When I run "AppNativeUnhandledScenario" and relaunch the app
  And I configure Bugsnag for "AppNativeUnhandledScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "java.lang.RuntimeException"
  And the exception "message" equals "AppNativeUnhandledScenario"
  And the event "app.version" equals "1.2.3"
  And the event "app.versionCode" equals 1
  And the event "app.releaseStage" equals "production"
  And the event "app.inForeground" is true
  And the event "app.duration" is not null
  And the event "app.durationInForeground" is not null

  # Android
  And the event "app.id" equals "com.reactnative"
  And the event "app.type" equals "android"
  # iOS
  # And the event "app.id" equals "org.reactjs.native.example.reactnative"
  # And the event "app.type" equals "ios"
