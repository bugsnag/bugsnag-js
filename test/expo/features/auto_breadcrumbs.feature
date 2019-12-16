Feature: Automatically added breadcrumbs

@skip_android_5
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

@skip_android_5
Scenario: App-state breadcrumbs can be disabled specifically
  Given the element "appStateBreadcrumbs" is present
  And I click the element "appStateBreadcrumbs"
  Given the element "disabledAppStateBreadcrumbsBehaviourButton" is present
  When I click the element "disabledAppStateBreadcrumbsBehaviourButton"
  And I send the app to the background for 2 seconds
  Given the element "triggerAppStateBreadcrumbsErrorButton" is present
  When I click the element "triggerAppStateBreadcrumbsErrorButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "disabledAppStateBreadcrumbsBehaviour"
  And the event does not have a "state" breadcrumb named "App state changed"

@skip_android_5
Scenario: App-state breadcrumbs are disabled with other auto-breadcrumbs
  Given the element "appStateBreadcrumbs" is present
  And I click the element "appStateBreadcrumbs"
  Given the element "disabledAllAppStateBreadcrumbsBehaviourButton" is present
  When I click the element "disabledAllAppStateBreadcrumbsBehaviourButton"
  And I send the app to the background for 2 seconds
  Given the element "triggerAppStateBreadcrumbsErrorButton" is present
  When I click the element "triggerAppStateBreadcrumbsErrorButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "disabledAllAppStateBreadcrumbsBehaviour"
  And the event does not have a "state" breadcrumb named "App state changed"

@skip_android_5
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

Scenario: Console breadcrumbs can be disabled explicitly
  Given the element "consoleBreadcrumbs" is present
  And I click the element "consoleBreadcrumbs"
  Given the element "disabledConsoleBreadcrumbsBehaviourButton" is present
  When I click the element "disabledConsoleBreadcrumbsBehaviourButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "disabledConsoleBreadcrumbsBehaviour"
  And the event does not have a "log" breadcrumb named "Console output"

Scenario: Console breadcrumbs are disabled with other auto-breadcrumbs
  Given the element "consoleBreadcrumbs" is present
  And I click the element "consoleBreadcrumbs"
  Given the element "disabledAllConsoleBreadcrumbsBehaviourButton" is present
  When I click the element "disabledAllConsoleBreadcrumbsBehaviourButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "disabledAllConsoleBreadcrumbsBehaviour"
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

Scenario: Network breadcrumbs are captured by default
  Given the element "networkBreadcrumbs" is present
  And I click the element "networkBreadcrumbs"
  Given the element "defaultNetworkBreadcrumbsBehaviourButton" is present
  When I click the element "defaultNetworkBreadcrumbsBehaviourButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "defaultNetworkBreadcrumbsBehaviour"
  And the event has a "request" breadcrumb named "XMLHttpRequest succeeded"
  And the event "breadcrumbs.1.metaData.status" equals 200
  And the event "breadcrumbs.1.metaData.request" equals "GET http://postman-echo.com/get"

Scenario: Network breadcrumbs can be disabled explicitly
  Given the element "networkBreadcrumbs" is present
  And I click the element "networkBreadcrumbs"
  Given the element "disabledNetworkBreadcrumbsBehaviourButton" is present
  When I click the element "disabledNetworkBreadcrumbsBehaviourButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "disabledNetworkBreadcrumbsBehaviour"
  And the event does not have a "request" breadcrumb named "XMLHttpRequest succeeded"

Scenario: Network breadcrumbs are disabled with other auto-breadcrumbs
  Given the element "networkBreadcrumbs" is present
  And I click the element "networkBreadcrumbs"
  Given the element "disabledAllNetworkBreadcrumbsBehaviourButton" is present
  When I click the element "disabledAllNetworkBreadcrumbsBehaviourButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "disabledAllNetworkBreadcrumbsBehaviour"
  And the event does not have a "request" breadcrumb named "XMLHttpRequest succeeded"

Scenario: Network breadcrumbs overrides auto-breadcrumbs
  Given the element "networkBreadcrumbs" is present
  And I click the element "networkBreadcrumbs"
  Given the element "overrideNetworkBreadcrumbsBehaviourButton" is present
  When I click the element "overrideNetworkBreadcrumbsBehaviourButton"
  Then I wait to receive a request
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "overrideNetworkBreadcrumbsBehaviour"
  And the event has a "request" breadcrumb named "XMLHttpRequest succeeded"
  And the event "breadcrumbs.0.metaData.status" equals 200
  And the event "breadcrumbs.0.metaData.request" equals "GET http://postman-echo.com/get"
