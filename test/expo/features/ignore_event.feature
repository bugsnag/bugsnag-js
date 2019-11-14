Feature: Ignoring an event

Background:
  Given the element "ignoreEvent" is present
  And I click the element "ignoreEvent"

Scenario: A event can be ignored using the ignore method
  Given the element "ignoreEventIgnoreButton" is present
  When I click the element "ignoreEventIgnoreButton"
  And I wait for 3 seconds
  Then I should receive no requests

Scenario: A event can be ignored by returning false
  Given the element "ignoreEventFalseButton" is present
  When I click the element "ignoreEventFalseButton"
  And I wait for 3 seconds
  Then I should receive no requests
