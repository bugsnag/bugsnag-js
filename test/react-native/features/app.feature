Feature: App data

Scenario: Handled JS error
  When I run "AppJsHandledScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "AppJsHandledScenario"
  And the event "unhandled" is false
  And the event "app.version" equals "1.2.3"
  # Parameter not present on iOS devices
  And the event "app.versionCode" equals the platform-dependent numeric:
    | android | 1     |
    | ios     | @skip |
  And the event "app.releaseStage" equals "production"
  And the event "app.inForeground" is true
  And the event "app.duration" is not null
  And the event "app.durationInForeground" is not null
  And the event "app.codeBundleId" equals "1.2.3-r00110011"
  And the event "app.id" equals the platform-dependent string:
  | android | com.reactnative                        |
  | ios     | com.bugsnag.fixtures.reactnative |
  And the event "app.type" equals the platform-dependent string:
  | android | android |
  | ios     | iOS     |

Scenario: Unhandled JS error
  When I run "AppJsUnhandledScenario" and relaunch the crashed app
  And I configure Bugsnag for "AppJsUnhandledScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "AppJsUnhandledScenario"
  And the event "unhandled" is true
  And the event "app.version" equals "1.2.3"
  # Parameter not present on iOS devices
  And the event "app.versionCode" equals the platform-dependent numeric:
    | android | 1     |
    | ios     | @skip |
  And the event "app.releaseStage" equals "production"
  And the event "app.inForeground" is true
  And the event "app.duration" is not null
  And the event "app.durationInForeground" is not null
  And the event "app.codeBundleId" equals "1.2.3-r00110011"
  And the event "app.id" equals the platform-dependent string:
  | android | com.reactnative                        |
  | ios     | com.bugsnag.fixtures.reactnative |
  And the event "app.type" equals the platform-dependent string:
  | android | android |
  | ios     | iOS   |

Scenario: Handled native error
  When I run "AppNativeHandledScenario"
  Then I wait to receive an error
  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the exception "message" equals "AppNativeHandledScenario"
  And the event "unhandled" is false
  And the event "app.version" equals "1.2.3"
  # Parameter not present on iOS devices
  And the event "app.versionCode" equals the platform-dependent numeric:
    | android | 1     |
    | ios     | @skip |
  And the event "app.releaseStage" equals "production"
  And the event "app.inForeground" is true
  And the event "app.duration" is not null
  And the event "app.durationInForeground" is not null
  And the event "app.codeBundleId" equals "1.2.3-r00110011"
  And the event "app.id" equals the platform-dependent string:
  | android | com.reactnative                        |
  | ios     | com.bugsnag.fixtures.reactnative |
  And the event "app.type" equals the platform-dependent string:
  | android | android |
  | ios     | iOS     |

Scenario: Unhandled native error
  When I run "AppNativeUnhandledScenario" and relaunch the crashed app
  And I configure Bugsnag for "AppNativeUnhandledScenario"
  Then I wait to receive an error
  And the event "exceptions.0.errorClass" equals the platform-dependent string:
  | android | java.lang.RuntimeException |
  | ios     | NSException                |
  And the exception "message" equals "AppNativeUnhandledScenario"
  And the event "unhandled" is true
  And the event "app.version" equals "1.2.3"
  # Parameter not present on iOS devices
  And the event "app.versionCode" equals the platform-dependent numeric:
    | android | 1     |
    | ios     | @skip |
  And the event "app.releaseStage" equals "production"
  And the event "app.inForeground" is true
  And the event "app.duration" is not null
  And the event "app.durationInForeground" is not null
  And the event "app.codeBundleId" equals "1.2.3-r00110011"
  And the event "app.id" equals the platform-dependent string:
  | android | com.reactnative                        |
  | ios     | com.bugsnag.fixtures.reactnative |
  And the event "app.type" equals the platform-dependent string:
  | android | android |
  | ios     | iOS     |

Scenario: Setting appType in configuration
  When I run "AppConfigAppTypeScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "AppConfigAppTypeScenario"
  And the event "unhandled" is false
  And the event "app.type" equals "mobileclient"

Scenario: Setting releaseStage in configuration
  When I run "AppConfigReleaseStageScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "AppConfigReleaseStageScenario"
  And the event "unhandled" is false
  And the event "app.releaseStage" equals "staging"

Scenario: Setting releaseStage and enabledReleaseStages to enable delivery
  When I run "AppConfigEnabledReleaseStagesScenario"
  Then I wait to receive an error
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "AppConfigEnabledReleaseStagesScenario"
  And the event "unhandled" is false
  And the event "app.releaseStage" equals "preprod"

Scenario: Setting releaseStage and enabledReleaseStages to disable delivery
  When I run "AppConfigEnabledReleaseStagesNoSendScenario"
  And I wait for 5 seconds
  Then I should receive no errors
