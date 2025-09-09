@grouping_discriminator
Feature: Grouping discriminator functionality

Scenario: multiple notify() calls with different grouping discriminators
  When I navigate to the test URL "/grouping_discriminator/script/index.html"
  Then I wait to receive 6 errors
  And the error is a valid browser payload for the error reporting API

  # First error - no discriminator
  And the error payload field "events.0.exceptions.0.message" equals "no-discriminator"
  And the error payload field "events.0.groupingDiscriminator" is not present
  
  # Second error - uses client discriminator
  And the error payload field "events.1.exceptions.0.message" equals "client-discriminator"
  And the error payload field "events.1.groupingDiscriminator" equals "client-discriminator"
  
  # Third error - uses event discriminator
  And the error payload field "events.2.groupingDiscriminator" equals "event-discriminator"
  And the error payload field "events.2.exceptions.0.message" equals "event-discriminator"
  
  # Fourth error - cleared discriminator on event (null)
  And the error payload field "events.3.groupingDiscriminator" equals "null-discriminator"
  And the error payload field "events.3.groupingDiscriminator" is not present

  # Fifth error - cleared discriminator on event (undefined)
  And the error payload field "events.4.groupingDiscriminator" equals "undefined-discriminator"
  And the error payload field "events.4.groupingDiscriminator" is not present

  # Sixth error - cleared discriminator on client and event
  And the error payload field "events.5.groupingDiscriminator" equals "no-discriminator-2"
  And the error payload field "events.5.groupingDiscriminator" is not present
