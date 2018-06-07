@csp
Feature: Compatibility with a Content Security Policy

Scenario Outline: notifer does not crash for CSP violations
  When I navigate to the URL "/csp/<type>/a.html"
  And the test should run in this browser
  Then I let the test page run for up to 10 seconds
    Examples:
      | type       |
      | script     |
