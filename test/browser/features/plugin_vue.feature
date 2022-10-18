@plugin_vue
Feature: Vue support

  @skip_ie_8 @skip_ie_9 @skip_ie_10
  Scenario: basic error handler usage
    When I navigate to the test URL "/plugin_vue/webpack4/index.html"
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "borked"
    And the event "metaData.vue.errorInfo" is not null

  Scenario: vue3 + typescript usage
    When I navigate to the test URL "/plugin_vue/typescript_vue3/index.html"
    And the test should run in this browser
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "borked"
    And the event "metaData.vue.errorInfo" equals "render function"
    And the event "metaData.vue.component" equals "App"

  Scenario: vue2 + typescript usage
    When I navigate to the test URL "/plugin_vue/typescript_vue2/index.html"
    And the test should run in this browser
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "borked"
    And the event "metaData.vue.errorInfo" equals "render"
    And the event "metaData.vue.component" equals "<Root>"
