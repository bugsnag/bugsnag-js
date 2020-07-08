Feature: App data

Scenario: Handled JS error
  When I run "AppJsHandledScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "AppJsHandledScenario"
  And the event "unhandled" is false
  And the event "app.version" equals "1.2.3"
  And the event "app.versionCode" equals 1
  And the event "app.releaseStage" equals "production"
  And the event "app.inForeground" is true
  And the event "app.duration" is not null
  And the event "app.durationInForeground" is not null
  And the event "app.codeBundleId" equals "1.2.3-r00110011"

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
  And the exception "message" equals "AppJsUnhandledScenario"
  And the event "unhandled" is true
  And the event "app.version" equals "1.2.3"
  And the event "app.versionCode" equals 1
  And the event "app.releaseStage" equals "production"
  And the event "app.inForeground" is true
  And the event "app.duration" is not null
  And the event "app.durationInForeground" is not null
  And the event "app.codeBundleId" equals "1.2.3-r00110011"

  # Android
  And the event "app.id" equals "com.reactnative"
  And the event "app.type" equals "android"
  # iOS
  # And the event "app.id" equals "org.reactjs.native.example.reactnative"
  # And the event "app.type" equals "ios"

Scenario: Handled native error
  When I run "AppNativeHandledScenario"
  And I configure Bugsnag for "AppNativeHandledScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "java.lang.RuntimeException"
  And the exception "message" equals "AppNativeHandledScenario"
  And the event "unhandled" is false
  And the event "app.version" equals "1.2.3"
  And the event "app.versionCode" equals 1
  And the event "app.releaseStage" equals "production"
  And the event "app.inForeground" is true
  And the event "app.duration" is not null
  And the event "app.durationInForeground" is not null
  And the event "app.codeBundleId" equals "1.2.3-r00110011"

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
  And the event "unhandled" is true
  And the event "app.version" equals "1.2.3"
  And the event "app.versionCode" equals 1
  And the event "app.releaseStage" equals "production"
  And the event "app.inForeground" is true
  And the event "app.duration" is not null
  And the event "app.durationInForeground" is not null
  And the event "app.codeBundleId" equals "1.2.3-r00110011"

  # Android
  And the event "app.id" equals "com.reactnative"
  And the event "app.type" equals "android"
  # iOS
  # And the event "app.id" equals "org.reactjs.native.example.reactnative"
  # And the event "app.type" equals "ios"

Scenario: Setting appType in configuration
  When I run "AppConfigAppTypeScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "AppConfigAppTypeScenario"
  And the event "unhandled" is false
  And the event "app.type" equals "mobileclient"

Scenario: Setting releaseStage in configuration
  When I run "AppConfigReleaseStageScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "AppConfigReleaseStageScenario"
  And the event "unhandled" is false
  And the event "app.releaseStage" equals "staging"

Scenario: Setting releaseStage and enabledReleaseStages to enable delivery
  When I run "AppConfigEnabledReleaseStagesScenario"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "AppConfigEnabledReleaseStagesScenario"
  And the event "unhandled" is false
  And the event "app.releaseStage" equals "preprod"

Scenario: Setting releaseStage and enabledReleaseStages to disable delivery
  When I run "AppConfigEnabledReleaseStagesNoSendScenario"
  And I wait for 5 seconds
  Then I should receive no requests
