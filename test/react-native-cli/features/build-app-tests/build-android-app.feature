Feature: Tests for building a React Native app (for Android only) that was initialized using the Bugsnag React Native CLI

  Scenario: A CLI initialized React Native Android app invokes a source map upload
    When I build the Android app
    And I wait to receive 2 builds

    Then the build is valid for the Build API
    And I discard the oldest build

    Then the Content-Type header is valid multipart form-data
    And the build payload field "apiKey" equals "1234567890ABCDEF1234567890ABCDEF"
    And the build payload field "platform" equals "android"
    And the build payload field "overwrite" equals "true"
