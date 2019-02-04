@navigation
Feature: Navigation

Scenario: inline script detected after location change
  When I navigate to the URL "/navigation/script/a.html"
  And the test should run in this browser
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the event "metaData.script.content" matches "throw new Error\('history'\)"
