Feature: Tests for building a React Native app (for Android only) that was initialized using the Bugsnag React Native CLI

  Scenario: A CLI initialized React Native Android app invokes a source map upload
    When I build the Android app
    And I wait to receive 1 sourcemaps

    Then the sourcemap is valid for the Build API

    Then the sourcemaps Content-Type header is valid multipart form-data
    And the sourcemap payload field "apiKey" equals "1234567890ABCDEF1234567890ABCDEF"
    And the sourcemap payload field "platform" equals "android"
    And the sourcemap payload field "overwrite" equals "true"
