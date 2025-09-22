When('I navigate to the test URL {string}') do |test_path|
  path = get_test_url test_path
  step("I navigate to the URL \"#{path}\"")
end

When('the exception matches the {string} values for the current browser') do |fixture|
  err = get_error_message(fixture)
  steps %(
    And the exception "errorClass" equals "#{err['errorClass']}"
    And the exception "message" equals "#{err['errorMessage']}"
  )
  if err['lineNumber']
    step("the \"lineNumber\" of stack frame 0 equals #{err['lineNumber']}")
  end
  if err['columnNumber']
    step("the \"columnNumber\" of stack frame 0 equals #{err['columnNumber']}")
  end
  if err['file']
    step("the \"file\" of stack frame 0 ends with \"#{err['file']}\"")
  end
end

When('the test should run in this browser') do
  wait = Selenium::WebDriver::Wait.new(timeout: 10)
  wait.until {
    Maze.driver.find_element(id: 'bugsnag-test-should-run') &&
        Maze.driver.find_element(id: 'bugsnag-test-should-run').text != 'PENDING'
  }
  if Maze.driver.find_element(id: 'bugsnag-test-should-run').text == 'NO'
    Maze::Server.reset!
    skip_this_scenario
  end
end

When('I let the test page run for up to {int} seconds') do |n|
  wait = Selenium::WebDriver::Wait.new(timeout: n)
  wait.until {
    Maze.driver.find_element(id: 'bugsnag-test-state') &&
        (
        Maze.driver.find_element(id: 'bugsnag-test-state').text == 'DONE' ||
            Maze.driver.find_element(id: 'bugsnag-test-state').text == 'ERROR'
        )
  }
  txt = Maze.driver.find_element(id: 'bugsnag-test-state').text
  Maze.check.equal('DONE', txt, "Expected #bugsnag-test-state text to be 'DONE'. It was '#{txt}'.")
end

When('the following sets are present in the current {word} payloads:') do |request_type, data_table|
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
    # if value is 'nil' then the field should not be present in the payload
    expected_data.each do |field_path, expected_value|
      expected_data[field_path] = nil if expected_value == 'nil'
    end
    Maze.check.true(payload_values.include?(expected_data),
                    "#{expected_data} was not found in any of the current payloads")
  end
end
