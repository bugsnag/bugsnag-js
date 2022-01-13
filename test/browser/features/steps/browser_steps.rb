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
  skip_this_scenario if Maze.driver.find_element(id: 'bugsnag-test-should-run').text == 'NO'
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
