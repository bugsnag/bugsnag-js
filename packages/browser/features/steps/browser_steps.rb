include Test::Unit::Assertions

When("I navigate to the URL {string}") do |path|
  $driver.navigate.to get_test_url path
end

When("the test should run in this browser") do
  wait = Selenium::WebDriver::Wait.new(timeout: 10)
  wait.until {
    $driver.find_element(id: 'bugsnag-test-should-run') &&
    $driver.find_element(id: 'bugsnag-test-should-run').text != 'PENDING'
  }
  skip_this_scenario if $driver.find_element(id: 'bugsnag-test-should-run').text == 'NO'
end

When("I let the test page run for up to {int} seconds") do |n|
  wait = Selenium::WebDriver::Wait.new(timeout: n)
  wait.until {
    $driver.find_element(id: 'bugsnag-test-state') &&
    (
      $driver.find_element(id: 'bugsnag-test-state').text == 'DONE' ||
      $driver.find_element(id: 'bugsnag-test-state').text == 'ERROR'
    )
  }
  txt = $driver.find_element(id: 'bugsnag-test-state').text
  assert_equal('DONE', txt, "Expected #bugsnag-test-state text to be 'DONE'. It was '#{txt}'.")
end

When("the exception matches the {string} values for the current browser") do |fixture|
  err = get_error_message(fixture)
  steps %Q{
    And the exception "errorClass" equals "#{err['errorClass']}"
    And the exception "message" equals "#{err['errorMessage']}"
  }
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

Then(/^the request is a valid browser payload for the error reporting API$/) do
  if !/^ie_(8|9|10)$/.match(ENV['BROWSER'])
    steps %Q{
      Then the "Bugsnag-API-Key" header is not null
      And the "Content-Type" header equals one of:
        | application/json |
        | application/json; charset=UTF-8 |
      And the "Bugsnag-Payload-Version" header equals "4"
      And the "Bugsnag-Sent-At" header is a timestamp
    }
  else
    steps %Q{
      Then the "apiKey" query parameter is not null
      And the "payloadVersion" query parameter equals "4"
      And the "sentAt" query parameter is a timestamp
    }
  end
  steps %Q{
    And the payload field "notifier.name" is not null
    And the payload field "notifier.url" is not null
    And the payload field "notifier.version" is not null
    And the payload field "events" is a non-empty array

    And each element in payload field "events" has "severity"
    And each element in payload field "events" has "severityReason.type"
    And each element in payload field "events" has "unhandled"
    And each element in payload field "events" has "exceptions"

    And the exception "type" equals "browserjs"
  }
end

Then(/^the request is a valid browser payload for the session tracking API$/) do
  if !/^ie_(8|9|10)$/.match(ENV['BROWSER'])
    steps %Q{
      Then the "Bugsnag-API-Key" header is not null
      And the "Content-Type" header equals one of:
        | application/json |
        | application/json; charset=UTF-8 |
      And the "Bugsnag-Payload-Version" header equals "1"
      And the "Bugsnag-Sent-At" header is a timestamp
    }
  else
    steps %Q{
      Then the "apiKey" query parameter is not null
      And the "payloadVersion" query parameter equals "1"
      And the "sentAt" query parameter is a timestamp
    }
  end
  steps %Q{
    And the payload field "app" is not null
    And the payload field "device" is not null
    And the payload field "notifier.name" is not null
    And the payload field "notifier.url" is not null
    And the payload field "notifier.version" is not null
    And the payload has a valid sessions array
  }
end
