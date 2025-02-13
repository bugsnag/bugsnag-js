Feature: Tests for building a React Native app (for iOS only) that was initialized using the Bugsnag React Native CLI

  Scenario: A CLI initialized React Native iOS app invokes a source map upload
    When I build the iOS app
    And I wait to receive 1 sourcemaps

    Then the sourcemap is valid for the Build API

    Then the sourcemaps Content-Type header is valid multipart form-data
    And the sourcemap payload field "apiKey" equals "1234567890ABCDEF1234567890ABCDEF"
    And the sourcemap payload field "platform" equals "ios"
    And the sourcemap payload field "overwrite" equals "true"

    # Re-archive and export an IPA that can be used for subsequent tests
    Then I export the iOS archive

