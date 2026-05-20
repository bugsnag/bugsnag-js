@plugin_vue
Feature: Vue support
  @skip_chrome_53
  Scenario: basic error handler usage
    When I navigate to the test URL "/plugin_vue/webpack4/index.html"
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "borked"
    And the event "metaData.vue.errorInfo" is not null
 
  @requires_let
  @requires_proxy
  @skip_safari_10 @skip_chrome_53
  Scenario: vue3 + typescript usage
    When I navigate to the test URL "/plugin_vue/typescript_vue3/index.html"
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "borked"
    And the event "metaData.vue.errorInfo" equals "render function"
    And the event "metaData.vue.component" equals "App"

  @requires_let
  @requires_proxy
  @skip_safari_10 @skip_chrome_53
  Scenario: vue2 + typescript usage
    When I navigate to the test URL "/plugin_vue/typescript_vue2/index.html"
    Then I wait to receive an error
    And the error is a valid browser payload for the error reporting API
    And the exception "errorClass" equals "Error"
    And the exception "message" equals "borked"
    And the event "metaData.vue.errorInfo" equals "render"
    And the event "metaData.vue.component" equals "<Root>"
