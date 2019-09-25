When("I run {string}") do |event_type|
  steps %Q{
    Given the element "scenarioInput" is present
    When I send the keys "#{event_type}" to the element "scenarioInput"
    And I click the element "startScenarioButton"
  }
end

When("I run {string} and relaunch the app") do |event_type|
  steps %Q{
    When I run "#{event_type}"
    And I clear any error dialogue
    And I relaunch the app
  }
end

When("I relaunch the app") do
  $driver.close_app
  $driver.launch_app
end

When("I clear any error dialogue") do
  sleep(3)
  # Error dialogue is auto-cleared on IOS
  unless $driver.device_type.start_with?("IOS")
    $driver.click_element("android:id/button1") if $driver.wait_for_element("android:id/button1", 1)
    $driver.click_element("android:id/aerr_close") if $driver.wait_for_element("android:id/aerr_close", 1)
    $driver.click_element("android:id/aerr_restart") if $driver.wait_for_element("android:id/aerr_restart", 1)
  end
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