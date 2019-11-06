Feature: Ignoring a report

Background:
  Given the element "ignoreReport" is present
  And I click the element "ignoreReport"

Scenario: A report can be ignored by returning false
  Given the element "ignoreReportFalseButton" is present
  When I click the element "ignoreReportFalseButton"
  And I wait for 3 seconds
  Then I should receive no requests
