Feature: Detecting and reporting errors

    Background:
        Given I launch an app

    Scenario: A crash in the main process
        When I click "main-process-crash"
        Then the app crashed

    Scenario: An unhandled promise rejection in the main process
        When I click "main-process-unhandled-promise-rejection"

    Scenario: An uncaught exception in the main process
        When I click "main-process-uncaught-exception"

    Scenario: An uncaught exception in the renderer
        When I click "renderer-uncaught-exception"

    Scenario: An unhandled promise rejection in the renderer
        When I click "renderer-unhandled-promise-rejection"
