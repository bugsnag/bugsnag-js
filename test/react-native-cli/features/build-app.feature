Feature: Tests for building a React Native app that was initialized using the Bugsnag React Native CLI

  Scenario: A CLI initialized React Native app invokes a source map upload
    When I run the script "test/react-native-cli/features/fixtures/build-fixture.sh" synchronously
    And I wait to receive a request
