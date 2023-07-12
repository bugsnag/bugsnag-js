When('I run {string}') do |event_type|
  steps %Q{
    Given the element "scenario_name" is present within 60 seconds
    When I clear and send the keys "#{event_type}" to the element "scenario_name"
    And I click the element "clear_data"
    And I click the element "start_bugsnag"
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

# Waits for up to 10 seconds for the app to stop running.  It seems that Appium doesn't always
# get the state correct (e.g. when backgrounding the app, or on old Android versions), so we
# don't fail if it still says running after the time allowed.
def wait_for_app_state(expected_state)
  max_attempts = 20
  attempts = 0
  state = get_app_state
  until (attempts >= max_attempts) || state == expected_state
    attempts += 1
    state = get_app_state
    sleep 0.5
  end
  $logger.warn "App state #{state} instead of #{expected_state} after 10s" unless state == expected_state
  state
end

def get_app_state
  case Maze::Helper.get_current_platform
  when 'ios'
    Maze.driver.app_state('com.bugsnag.fixtures.reactnative')
  when 'android'
    Maze.driver.app_state('com.reactnative')
  end
end

When('I relaunch the app after a crash') do
  state = wait_for_app_state :not_running
  # TODO: Really we should be using terminate_app/activate_app with the newer Appium client,
  #       but for some reason they seem to make some scenarios flaky (presumably due to the
  #       nature of how/when they close the app).
  if state != :not_running
    Maze.driver.close_app
    # Maze.driver.terminate_app Maze.driver.app_id
  end
  Maze.driver.launch_app
  # Maze.driver.activate_app Maze.driver.app_id
end

When('I clear any error dialogue') do
  # Error dialogue is auto-cleared on IOS
  next unless Maze.driver.capabilities['os'] == 'android'

  driver = Maze.driver
  driver.click_element('android:id/button1') if driver.wait_for_element('android:id/button1', 3)
  driver.click_element('android:id/aerr_close') if driver.wait_for_element('android:id/aerr_close', 3)
  driver.click_element('android:id/aerr_restart') if driver.wait_for_element('android:id/aerr_restart', 3)
end

When('I configure Bugsnag for {string}') do |event_type|
  steps %Q{
    Given the element "scenario_name" is present within 60 seconds
    When I clear and send the keys "#{event_type}" to the element "scenario_name"
    And I click the element "start_bugsnag"
  }
end

When('I configure the app to run in the {string} state') do |event_metadata|
  steps %Q{
    Given the element "scenario_metadata" is present
    And I clear and send the keys "#{event_metadata}" to the element "scenario_metadata"
  }
end

Then('the event {string} equals one of:') do |field_path, table|
  payload = Maze::Server.errors.current[:body]
  actual_value = Maze::Helper.read_key_path(payload, "events.0.#{field_path}")
  valid_values = table.raw.flatten
  Maze.check.true(valid_values.include?(actual_value),
                  "#{field_path} value: #{actual_value} did not match the given list: #{valid_values}")
end

Then('the {word} payload field {string} equals one of:') do |request_type, field_path, table|
  payload = Maze::Server.list_for(request_type).current[:body]
  actual_value = Maze::Helper.read_key_path(payload, field_path)
  valid_values = table.raw.flatten
  Maze.check.true(valid_values.include?(actual_value),
                  "#{field_path} value: #{actual_value} did not match the given list: #{valid_values}")
end

Then('the following sets are present in the current {word} payloads:') do |request_type, data_table|
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

Then('the stacktrace contains {string} equal to {string}') do |field_path, expected_value|
  values = Maze::Helper.read_key_path(Maze::Server.errors.current[:body], "events.0.exceptions.0.stacktrace")
  found = false
  values.each do |frame|
    found = true if Maze::Helper.read_key_path(frame, field_path) == expected_value
  end
  fail("No field_path #{field_path} found with value #{expected_value}") unless found
end
