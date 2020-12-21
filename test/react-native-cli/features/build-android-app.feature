Feature: Tests for building a React Native app (for Android only) that was initialized using the Bugsnag React Native CLI

  Scenario: A CLI initialized React Native Android app invokes a source map upload
    When I build the Android app
    And I wait to receive 2 requests

    Then the request is valid for the build API
    And I discard the oldest request

    Then the Content-Type header is valid multipart form-data
    And the payload field "apiKey" equals "12312312312312312312312312312312"
    And the payload field "platform" equals "android"
    And the payload field "overwrite" equals "false"
