Feature: Tests for building a React Native app (for iOS only) that was initialized using the Bugsnag React Native CLI

  Scenario: A CLI initialized React Native iOS app invokes a source map upload
    When I build the iOS app
    And I wait to receive a request

    Then the Content-Type header is valid multipart form-data
    And the payload field "apiKey" equals "1234567890ABCDEF1234567890ABCDEF"
    And the payload field "platform" equals "ios"
    And the payload field "overwrite" equals "true"
