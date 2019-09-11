When("I run {string}") do |event_type|
  steps %Q{
    Given the element "scenarioInput" is present
    When I send the keys "#{event_type}" to the element "scenarioInput"
    And I click the element "startScenarioButton"
  }
end

When("I configure Bugsnag for {string}") do |event_type|
  steps %Q{
    Given the element "scenarioInput" is present
    When I send the keys "#{event_type}" to the element "scenarioInput"
    And I click the element "startBugsnagButton"
  }
end

When("I configure the app to run in the {string} state") do |event_metadata|
  steps %Q{
    Given the element "scenarioMetaDataInput" is present
    And I send the keys "#{event_metadata}" to the element "scenarioMetaDataInput"
  }
end