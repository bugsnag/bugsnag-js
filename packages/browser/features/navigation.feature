@navigation
Feature: Navigation

Scenario Outline: inline script detected after location change
  When I navigate to the URL "/navigation/<type>/a.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the event "metaData.script.content" matches "throw new Error\('history'\)"
    Examples:
      | type       |
      | script     |
