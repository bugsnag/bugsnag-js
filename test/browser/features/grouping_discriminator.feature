@grouping_discriminator
Feature: Grouping discriminator functionality

Scenario: multiple notify() calls with different grouping discriminators
  When I navigate to the test URL "/grouping_discriminator/script/index.html"
  Then I wait to receive 6 errors
  And the error is a valid browser payload for the error reporting API
  And the following sets are present in the current error payloads:
    | events.0.exceptions.0.message | events.0.groupingDiscriminator |
    | no-discriminator              | nil                            |
    | client-discriminator          | client-discriminator           |
    | event-discriminator           | event-discriminator            |
    | null-discriminator            | nil                            |
    | undefined-discriminator       | nil                            |
    | no-discriminator-2            | nil                            |
