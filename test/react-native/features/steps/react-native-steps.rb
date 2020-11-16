When("I run {string}") do |event_type|
  steps %Q{
    Given the element "scenario_name" is present within 60 seconds
    When I clear and send the keys "#{event_type}" to the element "scenario_name"
    And I click the element "run_scenario"
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
  # This step should only be used when the app has crashed, but the notifier needs a little
  # time to write the crash report before being forced to reopen.  From trials, 1s was not enough.
  sleep(2)
  MazeRunner.driver.launch_app
end

When("I clear any error dialogue") do
  # Error dialogue is auto-cleared on IOS
  next unless MazeRunner.driver.capabilities["os"] == 'android'

  driver = MazeRunner.driver
  driver.click_element("android:id/button1") if driver.wait_for_element("android:id/button1", 3)
  driver.click_element("android:id/aerr_close") if driver.wait_for_element("android:id/aerr_close", 3)
  driver.click_element("android:id/aerr_restart") if driver.wait_for_element("android:id/aerr_restart", 3)
end

When("I configure Bugsnag for {string}") do |event_type|
  steps %Q{
    Given the element "scenario_name" is present within 60 seconds
    When I clear and send the keys "#{event_type}" to the element "scenario_name"
    And I click the element "start_bugsnag"
  }
end

When("I configure the app to run in the {string} state") do |event_metadata|
  steps %Q{
    Given the element "scenario_metadata" is present
    And I clear and send the keys "#{event_metadata}" to the element "scenario_metadata"
  }
end

Then("the event {string} equals one of:") do |field_path, table|
  actual_value = read_key_path(Server.current_request[:body], "events.0.#{field_path}")
  valid_values = table.raw.flatten
  assert_true(valid_values.include?(actual_value), "#{field_path} value: #{actual_value} did not match the given list: #{valid_values}")
end

Then("the payload field {string} equals one of:") do |field_path, table|
  actual_value = read_key_path(Server.current_request[:body], field_path)
  valid_values = table.raw.flatten
  assert_true(valid_values.include?(actual_value), "#{field_path} value: #{actual_value} did not match the given list: #{valid_values}")
end

Then("the following sets are present in the current payloads:") do |data_table|
  expected_values = data_table.hashes
  assert_equal(expected_values.length, Server.stored_requests.length)
  payload_values = Server.stored_requests.map do |request|
    payload_hash = {}
    data_table.headers.each_with_object(payload_hash) do |field_path, payload_hash|
      payload_hash[field_path] = read_key_path(request[:body], field_path)
    end
    payload_hash
  end
  expected_values.each do |expected_data|
    assert_true(payload_values.include?(expected_data), "#{expected_data} was not found in any of the current payloads")
  end
end
