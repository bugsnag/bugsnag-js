@plugin_vue
Feature: Vue support

Scenario Outline: basic error handler usage
  When I navigate to the URL "/plugin_vue/<type>/index.html"
  And the test should run in this browser
  And I let the test page run for up to 10 seconds
  And I wait for 5 seconds
  Then I should receive 1 request
  And the request is a valid browser payload for the error reporting API
  And the exception "errorClass" equals "Error"
  And the exception "message" equals "borked"
  And the event "metaData.vue.errorInfo" is not null
    Examples:
      | type     |
      | webpack4 |
