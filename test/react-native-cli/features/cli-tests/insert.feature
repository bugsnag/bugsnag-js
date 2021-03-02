Feature: insert command

Scenario: no git repo, do not run
    When I run the React Native service interactively
    And I input "bugsnag-react-native-cli insert" interactively
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
    And the iOS app does not contain the bugsnag initialisation code
    And the Android app does not contain the bugsnag initialisation code
    And the JavaScript layer does not contain the bugsnag initialisation code

Scenario: no git repo, run anyway
    When I run the React Native service interactively
    And I input "bugsnag-react-native-cli insert" interactively
    Then I wait for the shell to output a match for the regex "No repo detected\." to stdout
    And I wait for the interactive shell to output the following lines in stdout
        """
        This command may make modifications to your project. It is recommended that you commit the
        current status of your code to a git repo before continuing.
        """
    And I wait for the current stdout line to match the regex "Do you want to continue anyway\?"
    When I input "y" interactively
    And I wait for the shell to output a match for the regex "Adding Bugsnag to the JS layer" to stdout
    And I wait for the shell to output a match for the regex "Adding Bugsnag to the iOS layer" to stdout
    And I wait for the shell to output a match for the regex "Adding Bugsnag to the Android layer" to stdout
    Then the last interactive command exited successfully
    And the iOS app contains the bugsnag initialisation code
    And the Android app contains the bugsnag initialisation code
    And the JavaScript layer contains the bugsnag initialisation code

Scenario: running twice doesn't double-insert the code snippets
    When I run the React Native service interactively
    And I input "git init && git add -A && git commit -qm 'changes'" interactively
    And I input "bugsnag-react-native-cli insert" interactively
    Then I wait for the shell to output a match for the regex "This command may make modifications to your project\. Afterwards you can" to stdout
    And I wait for the shell to output "review the diff and commit them to your project." to stdout
    And I wait for the current stdout line to match the regex "Do you want to continue anyway\?"
    When I input a return interactively
    And I wait for the shell to output a match for the regex "Adding Bugsnag to the JS layer" to stdout
    And I wait for the shell to output a match for the regex "Adding Bugsnag to the iOS layer" to stdout
    And I wait for the shell to output a match for the regex "Adding Bugsnag to the Android layer" to stdout
    Then the last interactive command exited successfully
    And the iOS app contains the bugsnag initialisation code
    And the Android app contains the bugsnag initialisation code
    And the JavaScript layer contains the bugsnag initialisation code
    And the modified files are as expected after running the insert command
    When I input "git add -A && git commit -qm 'changes'" interactively
    Then there are no modified files in git
    When I input "bugsnag-react-native-cli insert" interactively
    And I wait for the current stdout line to match the regex "Do you want to continue anyway\?"
    When I input "y" interactively
    Then I wait for the shell to output a match for the regex "Bugsnag is already included, skipping" to stdout
    And the last interactive command exited successfully
    And there are no modified files in git
