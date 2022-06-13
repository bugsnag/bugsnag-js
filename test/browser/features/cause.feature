Feature: Error.cause

Scenario: Error thrown with an assigned Error cause property  
  When I navigate to the test URL "/cause/script/property.html"
  And I wait to receive an error
  Then the error is a valid browser payload for the error reporting API
  And the error payload field "events.0.exceptions.0.errorClass" equals "Error"
  And the error payload field "events.0.exceptions.0.message" equals "I am the error"
  And the error payload field "events.0.exceptions.0.type" equals "browserjs"
  And the error payload field "events.0.exceptions.0.stacktrace" is a non-empty array
  And the error payload field "events.0.exceptions.1.errorClass" equals "Error"
  And the error payload field "events.0.exceptions.1.message" equals "I am the cause"
  And the error payload field "events.0.exceptions.1.type" equals "browserjs"
  And the error payload field "events.0.exceptions.1.stacktrace" is an array with 0 elements

Scenario: Error thrown with an Error cause in the constructor  
  When I navigate to the test URL "/cause/script/constructor.html"
  And the test should run in this browser
  And I wait to receive an error
  Then the error is a valid browser payload for the error reporting API
  And the error payload field "events.0.exceptions.0.errorClass" equals "Error"
  And the error payload field "events.0.exceptions.0.message" equals "I am the error"
  And the error payload field "events.0.exceptions.0.type" equals "browserjs"
  And the error payload field "events.0.exceptions.0.stacktrace" is a non-empty array
  And the error payload field "events.0.exceptions.1.errorClass" equals "Error"
  And the error payload field "events.0.exceptions.1.message" equals "I am the cause"
  And the error payload field "events.0.exceptions.1.type" equals "browserjs"
  And the error payload field "events.0.exceptions.1.stacktrace" is an array with 0 elements
