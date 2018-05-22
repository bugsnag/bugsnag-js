@unhandled
Feature: Reporting unhandled errors

Scenario Outline: syntax errors
  When I navigate to the URL "/unhandled/<type>/a.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the exception matches the "unhandled_syntax" values for the current browser
    Examples:
      | type       |
      | script     |

Scenario Outline: thrown errors
  When I navigate to the URL "/unhandled/<type>/b.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the exception matches the "unhandled_thrown" values for the current browser
    Examples:
      | type       |
      | script     |

Scenario Outline: unhandled promise rejections
  When I navigate to the URL "/unhandled/<type>/c.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "broken promises"
    Examples:
      | type       |
      | script     |

Scenario Outline: undefined function invocation
  When I navigate to the URL "/unhandled/<type>/d.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the exception matches the "unhandled_undefined_function" values for the current browser
    Examples:
      | type       |
      | script     |

Scenario Outline: decoding malformed URI component
  When I navigate to the URL "/unhandled/<type>/e.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the exception matches the "unhandled_malformed_uri" values for the current browser
    Examples:
      | type       |
      | script     |

# Scenario Outline: thrown error with malformed stacktrace
#   When I navigate to the URL "/unhandled/<type>/a.html"
#     Examples:
#       | type       |
#       | script     |
