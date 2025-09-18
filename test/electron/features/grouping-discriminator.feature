Feature: Additional grouping discriminator
    Grouping discriminator field is included in electron events
    and can be passed between renderer and main processes.

    Scenario: Main process grouping discriminator is sent with main errors
        Given I launch an app with configuration:
            | bugsnag | default |
        When I click "main-process-set-grouping-discriminator"
        And I click "main-notify"
        Then the total requests received by the server matches:
            | events | 1 |
        And the event "groupingDiscriminator" equals "main-process-discriminator"

    Scenario: Renderer process grouping discriminator is sent with renderer errors
        Given I launch an app with configuration:
            | bugsnag | default |
        When I click "renderer-set-grouping-discriminator"
        And I click "renderer-notify"
        Then the total requests received by the server matches:
            | events | 1 |
        And the event "groupingDiscriminator" equals "renderer-process-discriminator"

    Scenario: Main process grouping discriminator persists across renderer errors
        Given I launch an app with configuration:
            | bugsnag | default |
        When I click "main-process-set-grouping-discriminator"
        And I click "renderer-notify"
        Then the total requests received by the server matches:
            | events | 1 |
        And the event "groupingDiscriminator" equals "main-process-discriminator"

    Scenario: Renderer process grouping discriminator persists across main errors
        Given I launch an app with configuration:
            | bugsnag | default |
        When I click "renderer-set-grouping-discriminator"
        And I click "main-notify"
        Then the total requests received by the server matches:
            | events | 1 |
        And the event "groupingDiscriminator" equals "renderer-process-discriminator"
