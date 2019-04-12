Feature: Automatically added breadcrumbs

Scenario: App-state breadcrumbs are captured by default
  Given the element "appStateBreadcrumbs" is present
  And I click the element "appStateBreadcrumbs"
  Given the element "defaultAppStateBreadcrumbsBehaviourButton" is present
  When I click the element "defaultAppStateBreadcrumbsBehaviourButton"
  And I send the app to the background for 2 seconds
  Given the element "triggerAppStateBreadcrumbsErrorButton" is present
  When I click the element "triggerAppStateBreadcrumbsErrorButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "defaultAppStateBreadcrumbsBehaviour"
  And the event has a "state" breadcrumb named "App state changed"

Scenario: App-state breadcrumbs can be disabled
  Given the element "appStateBreadcrumbs" is present
  And I click the element "appStateBreadcrumbs"
  Given the element "disabledAppStateBreadcrumbsBehaviour" is present
  When I click the element "disabledAppStateBreadcrumbsBehaviour"
  And I send the app to the background for 2 seconds
  Given the element "triggerAppStateBreadcrumbsErrorButton" is present
  When I click the element "triggerAppStateBreadcrumbsErrorButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "disabledAppStateBreadcrumbsBehaviour"
  And the event does not have a "state" breadcrumb named "App state changed"

Scenario: App-state breadcrumbs overrides auto-breadcrumbs
  Given the element "appStateBreadcrumbs" is present
  And I click the element "appStateBreadcrumbs"
  Given the element "overrideAppStateBreadcrumbsBehaviourButton" is present
  When I click the element "overrideAppStateBreadcrumbsBehaviourButton"
  And I send the app to the background for 2 seconds
  Given the element "triggerAppStateBreadcrumbsErrorButton" is present
  When I click the element "triggerAppStateBreadcrumbsErrorButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "overrideAppStateBreadcrumbsBehaviour"
  And the event has a "state" breadcrumb named "App state changed"

Scenario: Console breadcrumbs are captured by default
  Given the element "consoleBreadcrumbs" is present
  And I click the element "consoleBreadcrumbs"
  Given the element "defaultConsoleBreadcrumbsBehaviourButton" is present
  When I click the element "defaultConsoleBreadcrumbsBehaviourButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "defaultConsoleBreadcrumbsBehaviour"
  And the event has a "log" breadcrumb named "Console output"

Scenario: Console breadcrumbs can be disabled
  Given the element "consoleBreadcrumbs" is present
  And I click the element "consoleBreadcrumbs"
  Given the element "disabledConsoleBreadcrumbsBehaviourButton" is present
  When I click the element "disabledConsoleBreadcrumbsBehaviourButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "disabledConsoleBreadcrumbsBehaviour"
  And the event does not have a "log" breadcrumb named "Console output"

Scenario: Console breadcrumbs overrides auto-breadcrumbs
  Given the element "consoleBreadcrumbs" is present
  And I click the element "consoleBreadcrumbs"
  Given the element "overrideConsoleBreadcrumbsBehaviourButton" is present
  When I click the element "overrideConsoleBreadcrumbsBehaviourButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "overrideConsoleBreadcrumbsBehaviour"
  And the event has a "log" breadcrumb named "Console output"

Scenario: Orientation breadcrumbs are captured by default
  Given the element "orientationBreadcrumbs" is present
  And I click the element "orientationBreadcrumbs"
  Given the element "defaultOrientationBreadcrumbsBehaviourButton" is present
  When I click the element "defaultOrientationBreadcrumbsBehaviourButton"
  And I rotate the device
  Given the element "triggerOrientationBreadcrumbsErrorButton" is present
  When I click the element "triggerOrientationBreadcrumbsErrorButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "defaultOrientationBreadcrumbsBehaviour"
  And the event has a "state" breadcrumb named "Orientation changed"

Scenario: Orientation breadcrumbs can be disabled
  Given the element "orientationBreadcrumbs" is present
  And I click the element "orientationBreadcrumbs"
  Given the element "disabledOrientationBreadcrumbsBehaviourButton" is present
  When I click the element "disabledOrientationBreadcrumbsBehaviourButton"
  And I rotate the device
  Given the element "triggerOrientationBreadcrumbsErrorButton" is present
  When I click the element "triggerOrientationBreadcrumbsErrorButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "disabledOrientationBreadcrumbsBehaviour"
  And the event does not have a "state" breadcrumb named "Orientation changed"

Scenario: Orientation breadcrumbs overrides auto-breadcrumbs
  Given the element "orientationBreadcrumbs" is present
  And I click the element "orientationBreadcrumbs"
  Given the element "overrideOrientationBreadcrumbsBehaviourButton" is present
  When I click the element "overrideOrientationBreadcrumbsBehaviourButton"
  And I rotate the device
  Given the element "triggerOrientationBreadcrumbsErrorButton" is present
  When I click the element "triggerOrientationBreadcrumbsErrorButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "overrideOrientationBreadcrumbsBehaviour"
  And the event has a "state" breadcrumb named "Orientation changed"

Scenario: Connectivity breadcrumbs are captured by default
  Given the element "connectivityBreadcrumbs" is present
  And I click the element "connectivityBreadcrumbs"
  Given the element "defaultConnectivityBreadcrumbsBehaviourButton" is present
  When I click the element "defaultConnectivityBreadcrumbsBehaviourButton"
  And I activate and then disable airplane mode
  Given the element "triggerConnectivityBreadcrumbsErrorButton" is present
  When I click the element "triggerConnectivityBreadcrumbsErrorButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "defaultConnectivityBreadcrumbsBehaviour"
  And the event has a "state" breadcrumb named "Connectivity changed"

Scenario: Connectivity breadcrumbs can be disabled
  Given the element "connectivityBreadcrumbs" is present
  And I click the element "connectivityBreadcrumbs"
  Given the element "disabledConnectivityBreadcrumbsBehaviourButton" is present
  When I click the element "disabledConnectivityBreadcrumbsBehaviourButton"
  And I activate and then disable airplane mode
  Given the element "triggerConnectivityBreadcrumbsErrorButton" is present
  When I click the element "triggerConnectivityBreadcrumbsErrorButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "disabledConnectivityBreadcrumbsBehaviour"
  And the event has a "state" breadcrumb named "Connectivity changed"

Scenario: Connectivity breadcrumbs overrides auto-breadcrumbs
  Given the element "connectivityBreadcrumbs" is present
  And I click the element "connectivityBreadcrumbs"
  Given the element "overrideConnectivityBreadcrumbsBehaviourButton" is present
  When I click the element "overrideConnectivityBreadcrumbsBehaviourButton"
  And I activate and then disable airplane mode
  Given the element "triggerConnectivityBreadcrumbsErrorButton" is present
  When I click the element "triggerConnectivityBreadcrumbsErrorButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "overrideConnectivityBreadcrumbsBehaviour"
  And the event has a "state" breadcrumb named "Connectivity changed"