@plugin_vue
Feature: Vue support

Scenario: basic error handler usage
  When I navigate to the URL "/plugin_vue/webpack4/index.html"
  And the test should run in this browser
  Then I wait to receive a request
  And the request is a valid browser payload for the error reporting API
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "borked"
  And the event "metaData.vue.errorInfo" is not null
