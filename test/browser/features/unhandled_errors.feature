@unhandled
Feature: Reporting unhandled errors

Scenario: syntax errors
  When I navigate to the URL "/unhandled/script/a.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the exception matches the "unhandled_syntax" values for the current browser

Scenario: thrown errors
  When I navigate to the URL "/unhandled/script/b.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the exception matches the "unhandled_thrown" values for the current browser

Scenario: unhandled promise rejections
  When I navigate to the URL "/unhandled/script/c.html"
  And the test should run in this browser
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "broken promises"

Scenario: undefined function invocation
  When I navigate to the URL "/unhandled/script/d.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the exception matches the "unhandled_undefined_function" values for the current browser

Scenario: decoding malformed URI component
  When I navigate to the URL "/unhandled/script/e.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the exception matches the "unhandled_malformed_uri" values for the current browser

Scenario: detecting unhandled promise rejections with bluebird
  When I navigate to the URL "/unhandled/script/f.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "broken bluebird promises"

Scenario: parsing stacks correctly with "@" in filename
  When I navigate to the URL "/unhandled/script/g.html"
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the exception "message" ends with "at in filename"
  And the "file" of stack frame 0 ends with "unhandled/script/@dist/g.js"