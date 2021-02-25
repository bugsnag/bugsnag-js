Feature: install command

Scenario: no git repo, do not run
    When I run the React Native service interactively
    And I input "bugsnag-react-native-cli install" interactively
    Then I wait for the shell to output a match for the regex "No repo detected\." to stdout
    And I wait for the interactive shell to output the following lines in stdout
        """
        This command may make modifications to your project. It is recommended that you commit the
        current status of your code to a git repo before continuing.
        """
    And I wait for the current stdout line to match the regex "Do you want to continue anyway\?"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "\/app #"
    Then the last interactive command exited successfully
    And bugsnag react-native is not in the package.json file
    And the Bugsnag Android Gradle plugin is not installed

Scenario: dirty git repo, do not run
    When I run the React Native service interactively
    And I input "git init" interactively
    And I input "bugsnag-react-native-cli install" interactively
    Then I wait for the shell to output a match for the regex "Uncommited changes detected\." to stdout
    And I wait for the interactive shell to output the following lines in stdout
        """
        This command may make modifications to your project. It is recommended that you commit or
        stash your current changes before continuing.

        Afterwards you can review the diff of the changes made by this command and commit
        them to your project.
        """
    And I wait for the current stdout line to match the regex "Do you want to continue anyway\?"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "\/app #"
    Then the last interactive command exited successfully
    And bugsnag react-native is not in the package.json file
    And the Bugsnag Android Gradle plugin is not installed

Scenario: clean git repo, do not run
    When I run the React Native service interactively
    And I input "git init" interactively
    And I input "git add -A && git commit -qm 'changes'" interactively
    And I input "bugsnag-react-native-cli install" interactively
    Then I wait for the shell to output a match for the regex "This command may make modifications to your project\. Afterwards you can" to stdout
    And I wait for the shell to output "review the diff and commit them to your project." to stdout
    And I wait for the current stdout line to match the regex "Do you want to continue anyway\?"
    When I input "n" interactively
    And I wait for the current stdout line to match the regex "\/app #"
    Then the last interactive command exited successfully
    And bugsnag react-native is not in the package.json file
    And the Bugsnag Android Gradle plugin is not installed

Scenario: no git repo, run anyway, default version
    When I run the React Native service interactively
    And I input "bugsnag-react-native-cli install" interactively
    Then I wait for the shell to output a match for the regex "No repo detected\." to stdout
    And I wait for the interactive shell to output the following lines in stdout
        """
        This command may make modifications to your project. It is recommended that you commit the
        current status of your code to a git repo before continuing.
        """
    And I wait for the current stdout line to match the regex "Do you want to continue anyway\?"
    When I input "y" interactively
    Then I wait for the shell to output a match for the regex "Adding @bugsnag/react-native dependency" to stdout
    Then I wait for the current stdout line to match the regex "If you want the latest version of @bugsnag/react-native hit enter, otherwise type the version you want"
    When I input a return interactively
    Then I wait for the shell to output a match for the regex "\+ @bugsnag/react-native" to stdout
    And I wait for the current stdout line to match the regex "If you want the latest version of the Bugsnag Android Gradle plugin hit enter\, otherwise type the version you want"
    When I input a return interactively
    And I wait for the shell to output a match for the regex "Detected platform is not macOS\, skipping" to stdout
    Then the last interactive command exited successfully
    And bugsnag react-native is in the package.json file
    And the Bugsnag Android Gradle plugin is installed

Scenario: clean git repo, run, version 7.5.0
    When I run the React Native service interactively
    And I input "git init" interactively
    And I input "git add -A && git commit -qm 'changes'" interactively
    And I input "bugsnag-react-native-cli install" interactively
    Then I wait for the shell to output a match for the regex "This command may make modifications to your project\. Afterwards you can" to stdout
    And I wait for the shell to output "review the diff and commit them to your project." to stdout
    And I wait for the current stdout line to match the regex "Do you want to continue anyway\?"
    When I input a return interactively
    Then I wait for the shell to output a match for the regex "Adding @bugsnag/react-native dependency" to stdout
    Then I wait for the current stdout line to match the regex "If you want the latest version of @bugsnag/react-native hit enter, otherwise type the version you want"
    When I input "7.5.0" interactively
    Then I wait for the shell to output a match for the regex "\+ @bugsnag/react-native" to stdout
    And I wait for the current stdout line to match the regex "If you want the latest version of the Bugsnag Android Gradle plugin hit enter, otherwise type the version you want"
    When I input a return interactively
    And I wait for the shell to output a match for the regex "Detected platform is not macOS, skipping" to stdout
    And the last interactive command exited successfully
    And bugsnag react-native version "^7.5.0" is in the package.json file
    And the Bugsnag Android Gradle plugin is installed

Scenario: no git repo, run anyway, already installed
    When I run the React Native service interactively
    And I input "npm install @bugsnag/react-native" interactively
    Then I wait for the shell to output a match for the regex "\+ @bugsnag/react-native" to stdout
    And the last interactive command exited successfully
    And bugsnag react-native is in the package.json file
    When I input "bugsnag-react-native-cli install" interactively
    And I wait for the interactive shell to output the following lines in stdout
        """
        This command may make modifications to your project. It is recommended that you commit the
        current status of your code to a git repo before continuing.
        """
    And I wait for the current stdout line to match the regex "Do you want to continue anyway\?"
    When I input "y" interactively
    Then I wait for the shell to output a match for the regex "@bugsnag/react-native is already installed, skipping" to stdout
    And I wait for the current stdout line to match the regex "If you want the latest version of the Bugsnag Android Gradle plugin hit enter, otherwise type the version you want"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "\/app #"
    And the last interactive command exited successfully
    And the Bugsnag Android Gradle plugin is installed
