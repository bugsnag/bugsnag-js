@unhandled
Feature: Reporting unhandled errors

  Scenario: syntax errors
    When I navigate to the test URL "/unhandled/script/syntax_error.html"
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the exception matches the "unhandled_syntax" values for the current browser
    And the error payload field "events.0.app.type" equals "browser"
    And event 0 is unhandled

  Scenario: thrown errors
    When I navigate to the test URL "/unhandled/script/thrown.html"
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the exception matches the "unhandled_thrown" values for the current browser
    And event 0 is unhandled

  @requires_promise
  @requires_unhandled_rejection
  Scenario: unhandled promise rejections
    When I navigate to the test URL "/unhandled/script/promise_rejection.html"
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "broken promises"
    And event 0 is unhandled

  Scenario: undefined function invocation
    When I navigate to the test URL "/unhandled/script/undefined_function.html"
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the exception matches the "unhandled_undefined_function" values for the current browser
    And event 0 is unhandled

  Scenario: decoding malformed URI component
    When I navigate to the test URL "/unhandled/script/malformed_uri.html"
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the exception matches the "unhandled_malformed_uri" values for the current browser
    And event 0 is unhandled

  Scenario: detecting unhandled promise rejections with bluebird
    When I navigate to the test URL "/unhandled/script/bluebird.html"
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "broken bluebird promises"
    And event 0 is unhandled

  Scenario: parsing stacks correctly with "@" in filename
    When I navigate to the test URL "/unhandled/script/at_filename.html"
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the exception "message" ends with "at in filename"
    And the "file" of stack frame 0 ends with "unhandled/script/@dist/at_filename.js"
    And event 0 is unhandled

  Scenario: overridden handled state in a callback
    When I navigate to the test URL "/unhandled/script/override_unhandled.html"
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the exception "message" equals "hello"
    # The severity is "warning" because only the handled-ness has been changed
    And event 0 is unhandled with the severity "warning"
