Feature: Tests for building a React Native app (for Android only) that was initialized using the Bugsnag React Native CLI

  Scenario: A CLI initialized React Native app invokes a source map upload
    When I run the script "features/fixtures/build-fixture.sh" synchronously
    And I wait to receive a request
    Then the request is valid for the build API
    And I discard the oldest request

    And I wait to receive a request
    And the Content-Type header is valid multipart form-data
