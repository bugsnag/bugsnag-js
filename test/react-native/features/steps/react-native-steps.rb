def execute_command(action, scenario_name = '', scenario_data = '')
  address = if Maze.config.farm == :bb
              if Maze.config.aws_public_ip
                Maze.public_address
              else
                'local:9339'
              end
            else
              case Maze::Helper.get_current_platform
                when 'android'
                  'localhost:9339'
                else
                  'bs-local.com:9339'
              end
            end

  command = {
    action: action,
    scenario_name: scenario_name,
    notify: "http://#{address}/notify",
    sessions: "http://#{address}/sessions",
    api_key: $api_key,
    scenario_data: scenario_data
  }

  $logger.debug("Queuing command: #{command}")
  Maze::Server.commands.add command

  # Ensure fixture has read the command
  count = 900
  sleep 0.1 until Maze::Server.commands.remaining.empty? || (count -= 1) < 1
  raise 'Test fixture did not GET /command' unless Maze::Server.commands.remaining.empty?
end

When('I run {string}') do |scenario_name|
  execute_command 'run-scenario', scenario_name
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

When('I configure Bugsnag for {string}') do |scenario_name|
  execute_command 'start-bugsnag', scenario_name
end

When('I run {string} with data {string}') do |scenario_name, scenario_data|
  execute_command 'run-scenario', scenario_name, scenario_data
end

When('I run {string} with data {string} and relaunch the crashed app') do |scenario_name, scenario_data|
  steps %Q{
    When I run "#{scenario_name}" with data "#{scenario_data}"
    And I clear any error dialogue
    And I relaunch the app after a crash
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

# Tests that the given payload value is correct for the target arch and RN version combination.
# This step will assume the expected and payload values are strings.
#
# The DataTable used for this step should have the headers `arch` `version` and `value`
# The `arch` column must contain either `old` or `new`
# The `version` column should contain the version of the app to test the value against, or `default` for unspecified versions
# The `value` column should contain the expected value for the given arch and version combination
#
#   | arch | version | value                      |
#   | new  | 0.74    | Error                      |
#   | new  | default | java.lang.RuntimeException |
#   | old  | default | java.lang.RuntimeException |
#
# If the expected value is set to "@null", the check will be for null
# If the expected value is set to "@not_null", the check will be for a non-null value
Then('the event {string} equals the version-dependent string:') do |field_path, table|
  payload = Maze::Server.errors.current[:body]
  payload_value = Maze::Helper.read_key_path(payload, "events.0.#{field_path}")
  expected_values = table.hashes

  
  arch = ENV['RCT_NEW_ARCH_ENABLED'] == 'true' ? 'new' : 'old'
  arch_values = expected_values.select do |hash|
    hash['arch'] == arch
  end

  raise("There is no expected value for the current arch \"#{arch}\"") if arch_values.empty?

  current_version = ENV['RN_VERSION']
  version_values = arch_values.select do |hash|
    hash['version'] == current_version
  end

  if version_values.empty?
    version_values = arch_values.select { |hash| hash['version'] == 'default' }
  end

  raise("There is no expected value for the current version \"#{current_version}\"") if version_values.empty?
  raise("Multiple expected values found for arch \"#{arch}\" and version \"#{current_version}\"") if version_values.length() > 1

  expected_value = version_values[0]['value']
  assert_equal_with_nullability(expected_value, payload_value)
end
