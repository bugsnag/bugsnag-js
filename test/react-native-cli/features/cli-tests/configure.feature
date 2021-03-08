Feature: configure command

Scenario: no git repo, do not run
    When I run the React Native service interactively
    And I input "bugsnag-react-native-cli configure" interactively
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
    And the iOS app does not contain a bugsnag API key
    And the iOS app does not contain a bugsnag notify URL
    And the iOS app does not contain a bugsnag sessions URL
    And the Android app does not contain a bugsnag API key
    And the Android app does not contain a bugsnag notify URL
    And the Android app does not contain a bugsnag sessions URL

Scenario: no git repo, run anyway
    When I run the React Native service interactively
    And I input "bugsnag-react-native-cli configure" interactively
    Then I wait for the shell to output a match for the regex "No repo detected\." to stdout
    And I wait for the interactive shell to output the following lines in stdout
        """
        This command may make modifications to your project. It is recommended that you commit the
        current status of your code to a git repo before continuing.
        """
    And I wait for the current stdout line to match the regex "Do you want to continue anyway\?"
    When I input "y" interactively
    And I wait for the current stdout line to match the regex "Are you using Bugsnag on-premise\?"
    When I input a return interactively
    Then I wait for the current stdout line to match the regex "What is your Bugsnag project API key\?"
    When I input "abcdefabcdefabcdefabcdef12345678" interactively
    Then I wait for the shell to output a match for the regex "Updated AndroidManifest\.xml" to stdout
    And I wait for the shell to output a match for the regex "Updated Info\.plist" to stdout
    And the last interactive command exited successfully
    And the iOS app contains the bugsnag API key "abcdefabcdefabcdefabcdef12345678"
    And the iOS app does not contain a bugsnag notify URL
    And the iOS app does not contain a bugsnag sessions URL
    And the Android app contains the bugsnag API key "abcdefabcdefabcdefabcdef12345678"
    And the Android app does not contain a bugsnag notify URL
    And the Android app does not contain a bugsnag sessions URL

Scenario: no git repo, run anyway, invalid API key
    When I run the React Native service interactively
    And I input "bugsnag-react-native-cli configure" interactively
    Then I wait for the shell to output a match for the regex "No repo detected\." to stdout
    And I wait for the interactive shell to output the following lines in stdout
        """
        This command may make modifications to your project. It is recommended that you commit the
        current status of your code to a git repo before continuing.
        """
    And I wait for the current stdout line to match the regex "Do you want to continue anyway\?"
    When I input "y" interactively
    And I wait for the current stdout line to match the regex "Are you using Bugsnag on-premise\?"
    When I input a return interactively
    Then I wait for the current stdout line to match the regex "What is your Bugsnag project API key\?"
    When I input a return interactively
    Then I wait for the current stdout line to match the regex "API key is required\. You can find it by going to https://app\.bugsnag\.com/settings/ > Projects"
    When I input "abcd" interactively
    Then I wait for the current stdout line to match the regex "API key is required\. You can find it by going to https://app\.bugsnag\.com/settings/ > Projects"
    # Enter the last 28 characters of the API key as the previous input ("abcd") is still present
    When I input "efabcdefabcdefabcdef12345678" interactively
    Then I wait for the shell to output a match for the regex "Updated AndroidManifest\.xml" to stdout
    And I wait for the shell to output a match for the regex "Updated Info\.plist" to stdout
    And the last interactive command exited successfully
    And the iOS app contains the bugsnag API key "abcdefabcdefabcdefabcdef12345678"
    And the iOS app does not contain a bugsnag notify URL
    And the iOS app does not contain a bugsnag sessions URL
    And the Android app contains the bugsnag API key "abcdefabcdefabcdefabcdef12345678"
    And the Android app does not contain a bugsnag notify URL
    And the Android app does not contain a bugsnag sessions URL

Scenario: git repo, run
    When I run the React Native service interactively
    And I input "git init && git add -A && git commit -qm 'changes'" interactively
    And I input "bugsnag-react-native-cli configure" interactively
    Then I wait for the shell to output a match for the regex "This command may make modifications to your project\. Afterwards you can" to stdout
    And I wait for the shell to output "review the diff and commit them to your project." to stdout
    And I wait for the current stdout line to match the regex "Do you want to continue anyway\?"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "Are you using Bugsnag on-premise\?"
    When I input a return interactively
    Then I wait for the current stdout line to match the regex "What is your Bugsnag project API key\?"
    When I input "abcdefabcdefabcdefabcdef12345678" interactively
    Then I wait for the shell to output a match for the regex "Updated AndroidManifest\.xml" to stdout
    And I wait for the shell to output a match for the regex "Updated Info\.plist" to stdout
    And the last interactive command exited successfully
    And the iOS app contains the bugsnag API key "abcdefabcdefabcdefabcdef12345678"
    And the iOS app does not contain a bugsnag notify URL
    And the iOS app does not contain a bugsnag sessions URL
    And the Android app contains the bugsnag API key "abcdefabcdefabcdefabcdef12345678"
    And the Android app does not contain a bugsnag notify URL
    And the Android app does not contain a bugsnag sessions URL
    And the modified files are as expected after running the configure command

Scenario: git repo, do not run
    When I run the React Native service interactively
    And I input "git init && git add -A && git commit -qm 'changes'" interactively
    And I input "bugsnag-react-native-cli configure" interactively
    Then I wait for the shell to output a match for the regex "This command may make modifications to your project\. Afterwards you can" to stdout
    And I wait for the shell to output "review the diff and commit them to your project." to stdout
    And I wait for the current stdout line to match the regex "Do you want to continue anyway\?"
    When I input "n" interactively
    And I wait for the current stdout line to match the regex "\/app #"
    Then the last interactive command exited successfully
    And the iOS app does not contain a bugsnag API key
    And the iOS app does not contain a bugsnag notify URL
    And the iOS app does not contain a bugsnag sessions URL
    And the Android app does not contain a bugsnag API key
    And the Android app does not contain a bugsnag notify URL
    And the Android app does not contain a bugsnag sessions URL
    And there are no modified files in git

Scenario: custom endpoints
    When I run the React Native service interactively
    And I input "git init && git add -A && git commit -qm 'changes'" interactively
    And I input "bugsnag-react-native-cli configure" interactively
    Then I wait for the shell to output a match for the regex "This command may make modifications to your project\. Afterwards you can" to stdout
    And I wait for the shell to output "review the diff and commit them to your project." to stdout
    And I wait for the current stdout line to match the regex "Do you want to continue anyway\?"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "Are you using Bugsnag on-premise\?"
    When I input "y" interactively
    Then I wait for the current stdout line to match the regex "What is your Bugsnag notify endpoint\?"
    When I input "https://notify.example.com" interactively
    Then I wait for the current stdout line to match the regex "What is your Bugsnag sessions endpoint\?"
    When I input "https://sessions.example.com" interactively
    Then I wait for the current stdout line to match the regex "What is your Bugsnag project API key\?"
    When I input "abcdefabcdefabcdefabcdef12345678" interactively
    Then I wait for the shell to output a match for the regex "Updated AndroidManifest\.xml" to stdout
    And I wait for the shell to output a match for the regex "Updated Info\.plist" to stdout
    And the last interactive command exited successfully
    And the iOS app contains the bugsnag API key "abcdefabcdefabcdefabcdef12345678"
    And the iOS app contains the bugsnag notify URL "https://notify.example.com"
    And the iOS app contains the bugsnag sessions URL "https://sessions.example.com"
    And the Android app contains the bugsnag API key "abcdefabcdefabcdefabcdef12345678"
    And the Android app contains the bugsnag notify URL "https://notify.example.com"
    And the Android app contains the bugsnag sessions URL "https://sessions.example.com"
    And the modified files are as expected after running the configure command
