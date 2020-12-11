Feature: Tests against a React Native app that was initialized using the Bugsnag React Native CLI

Scenario: Build app sends JavaScript and Native handled errors
  When I cause a handled JavaScript error
  And I cause a handled native error
