Feature: React Native addOnError & onError callbacks

Scenario: Event is modified by addOnError callback
    When I run "AddOnErrorCallbackScenario"
    Then I wait to receive an error
    And the event "metaData.addonError.scenario" is true

  Scenario: Event is modified by onError callback
    When I run "OnErrorCallbackScenario"
    Then I wait to receive an error
    And the event "metaData.onError.scenario" is true