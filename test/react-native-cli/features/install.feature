Feature: install command

Scenario: no git repo, do not run
    When I run the React Native service interactively
    And I input "bugsnag-react-native-cli install" interactively
    Then I wait for the shell to output a line containing "No repo detected." to stdout
    And I wait for the shell to output the following to stdout
        """
        This command may make modifications to your project. It is recommended that you commit the
        current status of your code to a git repo before continuing.
        """
    And the current stdout line contains "Do you want to continue anyway?"
    When I press enter
    Then the last interactive command exited successfully
    And bugsnag has not been added to the package.json file

Scenario: no git repo, run anyway, default version
    When I run the React Native service interactively
    And I input "bugsnag-react-native-cli install" interactively
    Then I wait for the shell to output a line containing "No repo detected." to stdout
    And I wait for the shell to output the following to stdout
        """
        This command may make modifications to your project. It is recommended that you commit the
        current status of your code to a git repo before continuing.
        """
    And the current stdout line contains "Do you want to continue anyway?"
    When I input "y" interactively
    Then I wait for the shell to output a line containing "Adding @bugsnag/react-native dependency" to stdout
    And I wait for the shell to output a line containing "Using yarn or npm" to stdout
    When I press enter
    Then I wait for the current stdout line to contain "If you want the latest version of @bugsnag/react-native hit enter, otherwise type the version you want"
    When I press enter
    Then I wait for the shell to output a line containing "+ @bugsnag/react-native" to stdout
    And the last interactive command exited successfully
    And bugsnag has been added to the package.json file
