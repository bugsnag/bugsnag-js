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
