Feature: Manually added breadcrumbs

Background:
  Given the element "manualBreadcrumbs" is present
  And I click the element "manualBreadcrumbs"

@skip_ios_10 @skip_ios_11 @skip_ios_12
Scenario: Manual breadcrumbs are enabled when automatic breadcrumbs are disabled
  Given the element "manualBreadcrumbButton" is present
  When I click the element "manualBreadcrumbButton"
  Then I wait to receive an error
  And the exception "message" equals "ManualBreadcrumbError"
  And the event has a "manual" breadcrumb named "manualBreadcrumb"
  And the event "breadcrumbs.0.metaData.reason" equals "testing"
  And the error Bugsnag-Integrity header is valid
