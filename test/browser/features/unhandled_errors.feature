@unhandled
Feature: Reporting unhandled errors

Scenario: syntax errors
  When I navigate to the test URL "/unhandled/script/a.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the exception matches the "unhandled_syntax" values for the current browser
  And event 0 is unhandled

Scenario: thrown errors
  When I navigate to the test URL "/unhandled/script/b.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the exception matches the "unhandled_thrown" values for the current browser
  And event 0 is unhandled

Scenario: unhandled promise rejections
  When I navigate to the test URL "/unhandled/script/c.html"
  And the test should run in this browser
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "broken promises"
  And event 0 is unhandled

Scenario: undefined function invocation
  When I navigate to the test URL "/unhandled/script/d.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the exception matches the "unhandled_undefined_function" values for the current browser
  And event 0 is unhandled

Scenario: decoding malformed URI component
  When I navigate to the test URL "/unhandled/script/e.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the exception matches the "unhandled_malformed_uri" values for the current browser
  And event 0 is unhandled

Scenario: detecting unhandled promise rejections with bluebird
  When I navigate to the test URL "/unhandled/script/f.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "broken bluebird promises"
  And event 0 is unhandled

Scenario: parsing stacks correctly with "@" in filename
  When I navigate to the test URL "/unhandled/script/g.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the exception "message" ends with "at in filename"
  And the "file" of stack frame 0 ends with "unhandled/script/@dist/g.js"
  And event 0 is unhandled

Scenario: overridden handled state in a callback
  When I navigate to the test URL "/unhandled/script/h.html"
  Then I wait to receive an error
  And the request is a valid browser payload for the error reporting API
  And the exception "message" equals "hello"
  # The severity is "warning" because only the handled-ness has been changed
  And event 0 is unhandled with the severity "warning"
