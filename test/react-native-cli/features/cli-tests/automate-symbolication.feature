Feature: automate symbolication command

Scenario: successfully modify project
    When I run the React Native service interactively
    And I input "bugsnag-react-native-cli automate-symbolication" interactively
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
    And I wait for the current stdout line to match the regex "Do you want to automatically upload JavaScript source maps as part of the Xcode build\?"
    When I input a return interactively
    And I wait for the interactive shell to output the following lines in stdout
        """
        To configure your project to upload dSYMs, follow the iOS symbolication guide:

        https://docs.bugsnag.com/platforms/ios/symbolication-guide/

        This will enable you to see full native stacktraces. It can't be done automatically.
        """
    And I wait for the current stdout line to match the regex "Hit enter to continue"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "Do you want to install the BugSnag CLI to allow you to upload JavaScript source maps\?"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "If you want the latest version of @bugsnag/cli hit enter, otherwise type the version you want"
    And I wait for the interactive shell to output the following lines in stdout
        """
        You are running a version of React Native that we cannot automatically integrate with due to known issues with the build when Hermes is enabled.

        If you cannot upgrade to a later version of React Native (version 0.68 or above), you can use an older version of this CLI (version 7.20.x or earlier)

        or follow the manual integration instructions in our online docs: https://docs.bugsnag.com/platforms/react-native/react-native/manual-setup/')
        """
    And I wait for the current stdout line to match the regex "Hit enter to continue"
    When I input a return interactively
    When I input a return interactively
    Then I wait for the shell to output a match for the regex "@bugsnag/cli dependency is installed" to stdout
    Then the last interactive command exited successfully
    And bugsnag cli library is in the package.json file
    And the iOS build has been modified to upload source maps
    And the Bugsnag Android Gradle plugin is not installed
    And the Android build has been modified to upload source maps

Scenario: successfully modify project, choosing source-maps version
    When I run the React Native service interactively
    And I input "bugsnag-react-native-cli automate-symbolication" interactively
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
    And I wait for the current stdout line to match the regex "Do you want to automatically upload JavaScript source maps as part of the Xcode build\?"
    When I input a return interactively
    And I wait for the interactive shell to output the following lines in stdout
        """
        To configure your project to upload dSYMs, follow the iOS symbolication guide:

        https://docs.bugsnag.com/platforms/ios/symbolication-guide/

        This will enable you to see full native stacktraces. It can't be done automatically.
        """
    And I wait for the current stdout line to match the regex "Hit enter to continue"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "Do you want to install the BugSnag CLI to allow you to upload JavaScript source maps\?"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "If you want the latest version of @bugsnag/cli hit enter, otherwise type the version you want"
    When I input "1.1.8" interactively
    Then I wait for the shell to output a match for the regex "@bugsnag/cli dependency is installed" to stdout
    And I wait for the interactive shell to output the following lines in stdout
        """
        You are running a version of React Native that we cannot automatically integrate with due to known issues with the build when Hermes is enabled.

        If you cannot upgrade to a later version of React Native (version 0.68 or above), you can use an older version of this CLI (version 7.20.x or earlier)

        or follow the manual integration instructions in our online docs: https://docs.bugsnag.com/platforms/react-native/react-native/manual-setup/')
        """
    And I wait for the current stdout line to match the regex "Hit enter to continue"
    When I input a return interactively
    Then the last interactive command exited successfully
    And bugsnag cli library version "^1.1.8" is in the package.json file
    And the iOS build has been modified to upload source maps
    And the Bugsnag Android Gradle plugin is not installed
    And the Android build has been modified to upload source maps

Scenario: successfully modify project with custom endpoints
    When I run the React Native service interactively
    And I input "bugsnag-react-native-cli automate-symbolication" interactively
    Then I wait for the shell to output a match for the regex "No repo detected\." to stdout
    And I wait for the interactive shell to output the following lines in stdout
        """
        This command may make modifications to your project. It is recommended that you commit the
        current status of your code to a git repo before continuing.
        """
    And I wait for the current stdout line to match the regex "Do you want to continue anyway\?"
    When I input "y" interactively
    And I wait for the current stdout line to match the regex "Are you using Bugsnag on-premise\?"
    When I input "y" interactively
    And I wait for the current stdout line to match the regex "What is your Bugsnag upload endpoint\?"
    When I input "https://upload.example.com" interactively
    And I wait for the current stdout line to match the regex "What is your Bugsnag build endpoint\?"
    When I input "https://build.example.com" interactively
    And I wait for the current stdout line to match the regex "Do you want to automatically upload JavaScript source maps as part of the Xcode build\?"
    When I input a return interactively
    And I wait for the interactive shell to output the following lines in stdout
        """
        To configure your project to upload dSYMs, follow the iOS symbolication guide:

        https://docs.bugsnag.com/platforms/ios/symbolication-guide/

        This will enable you to see full native stacktraces. It can't be done automatically.
        """
    And I wait for the current stdout line to match the regex "Hit enter to continue"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "Do you want to install the BugSnag CLI to allow you to upload JavaScript source maps\?"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "If you want the latest version of @bugsnag/cli hit enter, otherwise type the version you want"
    When I input a return interactively
    Then I wait for the shell to output a match for the regex "@bugsnag/cli dependency is installed" to stdout
    And I wait for the interactive shell to output the following lines in stdout
        """
        You are running a version of React Native that we cannot automatically integrate with due to known issues with the build when Hermes is enabled.

        If you cannot upgrade to a later version of React Native (version 0.68 or above), you can use an older version of this CLI (version 7.20.x or earlier)

        or follow the manual integration instructions in our online docs: https://docs.bugsnag.com/platforms/react-native/react-native/manual-setup/')
        """
    And I wait for the current stdout line to match the regex "Hit enter to continue"
    When I input a return interactively
    Then the last interactive command exited successfully
    And bugsnag cli library is in the package.json file
    And the iOS build has been modified to upload source maps to "https://upload.example.com"
    And the Bugsnag Android Gradle plugin is not installed
    And the Android build has been modified to upload source maps to "https://upload.example.com"
    And the Android build has been modified to upload builds to "https://build.example.com"

Scenario: opt not to modify the Android project
    When I run the React Native service interactively
    And I input "bugsnag-react-native-cli automate-symbolication" interactively
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
    And I wait for the current stdout line to match the regex "Do you want to automatically upload JavaScript source maps as part of the Xcode build\?"
    When I input a return interactively
    And I wait for the interactive shell to output the following lines in stdout
        """
        To configure your project to upload dSYMs, follow the iOS symbolication guide:

        https://docs.bugsnag.com/platforms/ios/symbolication-guide/

        This will enable you to see full native stacktraces. It can't be done automatically.
        """
    And I wait for the current stdout line to match the regex "Hit enter to continue"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "Do you want to install the BugSnag CLI to allow you to upload JavaScript source maps\?"
    When I input "n" interactively
    And I wait for the current stdout line to match the regex "If you want the latest version of @bugsnag/source-maps hit enter, otherwise type the version you want"
    When I input a return interactively
    Then I wait for the shell to output a match for the regex "@bugsnag/source-maps dependency is installed" to stdout
    Then the last interactive command exited successfully
    And bugsnag source maps library is in the package.json file
    And the iOS build has been modified to upload source maps
    And the Bugsnag Android Gradle plugin is not installed
    And the Android build has not been modified to upload source maps

Scenario: opt not to modify the iOS project
    When I run the React Native service interactively
    And I input "bugsnag-react-native-cli automate-symbolication" interactively
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
    And I wait for the current stdout line to match the regex "Do you want to automatically upload JavaScript source maps as part of the Xcode build\?"
    When I input "n" interactively
    And I wait for the interactive shell to output the following lines in stdout
        """
        To configure your project to upload dSYMs, follow the iOS symbolication guide:

        https://docs.bugsnag.com/platforms/ios/symbolication-guide/

        This will enable you to see full native stacktraces. It can't be done automatically.
        """
    And I wait for the current stdout line to match the regex "Hit enter to continue"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "Do you want to install the BugSnag CLI to allow you to upload JavaScript source maps\?"
    When I input "y" interactively
    And I wait for the current stdout line to match the regex "If you want the latest version of @bugsnag/cli hit enter, otherwise type the version you want"
    When I input a return interactively
    Then I wait for the shell to output a match for the regex "@bugsnag/cli dependency is installed" to stdout
    And I wait for the interactive shell to output the following lines in stdout
        """
        You are running a version of React Native that we cannot automatically integrate with due to known issues with the build when Hermes is enabled.

        If you cannot upgrade to a later version of React Native (version 0.68 or above), you can use an older version of this CLI (version 7.20.x or earlier)

        or follow the manual integration instructions in our online docs: https://docs.bugsnag.com/platforms/react-native/react-native/manual-setup/')
        """
    And I wait for the current stdout line to match the regex "Hit enter to continue"
    When I input a return interactively
    Then the last interactive command exited successfully
    And bugsnag cli library is in the package.json file
    And the iOS build has not been modified to upload source maps
    And the Bugsnag Android Gradle plugin is not installed
    And the Android build has been modified to upload source maps

Scenario: opt not to modify either project
    When I run the React Native service interactively
    And I input "bugsnag-react-native-cli automate-symbolication" interactively
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
    And I wait for the current stdout line to match the regex "Do you want to automatically upload JavaScript source maps as part of the Xcode build\?"
    When I input "n" interactively
    And I wait for the interactive shell to output the following lines in stdout
        """
        To configure your project to upload dSYMs, follow the iOS symbolication guide:

        https://docs.bugsnag.com/platforms/ios/symbolication-guide/

        This will enable you to see full native stacktraces. It can't be done automatically.
        """
    And I wait for the current stdout line to match the regex "Hit enter to continue"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "Do you want to install the BugSnag CLI to allow you to upload JavaScript source maps\?"
    When I input "n" interactively
    And I wait for the current stdout line to match the regex "\/app #"
    Then the last interactive command exited successfully
    And bugsnag source maps library is not in the package.json file
    And the iOS build has not been modified to upload source maps
    And the Bugsnag Android Gradle plugin is not installed
    And the Android build has not been modified to upload source maps
