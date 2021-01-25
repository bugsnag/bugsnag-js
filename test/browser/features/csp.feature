@csp
Feature: Compatibility with a Content Security Policy

Scenario: notifer does not crash for CSP violations
  When I navigate to the test URL "/csp/script/a.html"
  Then I let the test page run for up to 10 seconds
