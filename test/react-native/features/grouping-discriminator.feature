@grouping_discriminator
Feature: Grouping discriminator functionality

Scenario: multiple notify() calls with different grouping discriminators
  When I run "GroupingDiscriminatorScenario"
  And I wait to receive 6 errors
  And the following sets are present in the current error payloads:
    | events.0.exceptions.0.message | events.0.groupingDiscriminator |
    | no-discriminator              | nil                            |
    | client-discriminator          | client-discriminator           |
    | event-discriminator           | event-discriminator            |
    | null-discriminator            | nil                            |
    | undefined-discriminator       | nil                            |
    | no-discriminator-2            | nil                            |
