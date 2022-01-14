def wait_for_true
  # max_attempts = 300
  max_attempts = 100
  attempts = 0
  assertion_passed = false
  until (attempts >= max_attempts) || assertion_passed
    attempts += 1
    assertion_passed = yield
    sleep 0.1
  end
  # raise 'Assertion not passed in 30s' unless assertion_passed
end

When("I run {string}") do |event_type|
  steps %Q{
    Given the element "scenario_name" is present within 60 seconds
    When I clear and send the keys "#{event_type}" to the element "scenario_name"
    And I click the element "run_scenario"
  }
end

When('I run {string} and relaunch the crashed app') do |event_type|
  steps %Q{
    When I run "#{event_type}"
    And I clear any error dialogue
    And I relaunch the app after a crash
  }
end

Then('the app is not running') do
  wait_for_true do
    state = Maze.driver.app_state('org.reactjs.native.example.reactnative')
    $logger.info state
    case Maze::Helper.get_current_platform
    when 'ios'
      state == :not_running
    when 'android'
      # workaround for faulty app state detection in appium v1.23 and lower on
      # Android where an app that is not running is detected to be running in
      # the background
      state == :not_running || state == :running_in_background
    end
  end
end

When('I relaunch the app after a crash') do
  # Wait for the app to stop running before relaunching
  step 'the app is not running'
  Maze.driver.launch_app
end

When("I clear any error dialogue") do
  # Error dialogue is auto-cleared on IOS
  next unless Maze.driver.capabilities["os"] == 'android'

  driver = Maze.driver
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
  payload = Maze::Server.errors.current[:body]
  actual_value = Maze::Helper.read_key_path(payload, "events.0.#{field_path}")
  valid_values = table.raw.flatten
  Maze.check.true(valid_values.include?(actual_value),
                  "#{field_path} value: #{actual_value} did not match the given list: #{valid_values}")
end

Then("the {word} payload field {string} equals one of:") do |request_type, field_path, table|
  payload = Maze::Server.list_for(request_type).current[:body]
  actual_value = Maze::Helper.read_key_path(payload, field_path)
  valid_values = table.raw.flatten
  Maze.check.true(valid_values.include?(actual_value),
                  "#{field_path} value: #{actual_value} did not match the given list: #{valid_values}")
end

Then("the following sets are present in the current {word} payloads:") do |request_type, data_table|
  expected_values = data_table.hashes
  requests = Maze::Server.list_for(request_type)
  Maze.check.equal(expected_values.length, requests.size_all)
  payload_values = requests.all.map do |request|
    payload_hash = {}
    data_table.headers.each_with_object(payload_hash) do |field_path, payload_hash|
      payload_hash[field_path] = Maze::Helper.read_key_path(request[:body], field_path)
    end
    payload_hash
  end
  expected_values.each do |expected_data|
    Maze.check.true(payload_values.include?(expected_data),
                    "#{expected_data} was not found in any of the current payloads")
  end
end
