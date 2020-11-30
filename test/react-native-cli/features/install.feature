Feature: install command

Scenario: running 'install' on an empty fixture
    When I run the service "rn0_60" interactively
    And I input "bugsnag-react-native-cli" interactively
    Then I wait for the shell to output "bugsnag-react-native-cli <command>" to stdout
