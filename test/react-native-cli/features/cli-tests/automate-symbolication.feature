Feature: automate symbolication command

Scenario: successfully modify project
    When I run the React Native service interactively
    And I input "bugsnag-react-native-cli automate-symbolication" interactively
    Then I wait for the shell to output a line containing "No repo detected." to stdout
    And I wait for the shell to output the following to stdout
        """
        This command may make modifications to your project. It is recommended that you commit the
        current status of your code to a git repo before continuing.
        """
    And I wait for the current stdout line to contain "Do you want to continue anyway?"
    When I input "y" interactively
    And I wait for the current stdout line to contain "Are you using Bugsnag on-premise?"
    When I press enter
    And I wait for the current stdout line to contain "Do you want to automatically upload source maps as part of the Xcode build?"
    When I press enter
    And I wait for the shell to output the following to stdout
        """
        To configure your project to upload dSYMs, follow the iOS symbolication guide:

        https://docs.bugsnag.com/platforms/ios/symbolication-guide/

        This will enable you to see full native stacktraces. It can't be done automatically.
        """
    And I wait for the current stdout line to contain "Hit enter to continue"
    When I press enter
    And I wait for the current stdout line to contain "Do you want to automatically upload source maps as part of the Gradle build?"
    When I press enter
    And I wait for the current stdout line to contain "If you want the latest version of @bugsnag/source-maps hit enter, otherwise type the version you want"
    When I press enter
    Then I wait for the shell to output a line containing "@bugsnag/source-maps dependency is installed" to stdout
    Then the last interactive command exited successfully
    And bugsnag source maps library is in the package.json file
    And the iOS build has been modified to upload source maps
    And the Bugsnag Android Gradle plugin is not installed
    And the Android build has been modified to upload source maps

Scenario: successfully modify project, choosing source-maps version
    When I run the React Native service interactively
    And I input "bugsnag-react-native-cli automate-symbolication" interactively
    Then I wait for the shell to output a line containing "No repo detected." to stdout
    And I wait for the shell to output the following to stdout
        """
        This command may make modifications to your project. It is recommended that you commit the
        current status of your code to a git repo before continuing.
        """
    And I wait for the current stdout line to contain "Do you want to continue anyway?"
    When I input "y" interactively
    And I wait for the current stdout line to contain "Are you using Bugsnag on-premise?"
    When I press enter
    And I wait for the current stdout line to contain "Do you want to automatically upload source maps as part of the Xcode build?"
    When I press enter
    And I wait for the shell to output the following to stdout
        """
        To configure your project to upload dSYMs, follow the iOS symbolication guide:

        https://docs.bugsnag.com/platforms/ios/symbolication-guide/

        This will enable you to see full native stacktraces. It can't be done automatically.
        """
    And I wait for the current stdout line to contain "Hit enter to continue"
    When I press enter
    And I wait for the current stdout line to contain "Do you want to automatically upload source maps as part of the Gradle build?"
    When I press enter
    And I wait for the current stdout line to contain "If you want the latest version of @bugsnag/source-maps hit enter, otherwise type the version you want"
    When I input "1.0.0-beta.1" interactively
    Then I wait for the shell to output a line containing "@bugsnag/source-maps dependency is installed" to stdout
    Then the last interactive command exited successfully
    And bugsnag source maps library version "^1.0.0-beta.1" is in the package.json file
    And the iOS build has been modified to upload source maps
    And the Bugsnag Android Gradle plugin is not installed
    And the Android build has been modified to upload source maps

Scenario: successfully modify project with custom endpoints
    When I run the React Native service interactively
    And I input "bugsnag-react-native-cli automate-symbolication" interactively
    Then I wait for the shell to output a line containing "No repo detected." to stdout
    And I wait for the shell to output the following to stdout
        """
        This command may make modifications to your project. It is recommended that you commit the
        current status of your code to a git repo before continuing.
        """
    And I wait for the current stdout line to contain "Do you want to continue anyway?"
    When I input "y" interactively
    And I wait for the current stdout line to contain "Are you using Bugsnag on-premise?"
    When I input "y" interactively
    And I wait for the current stdout line to contain "What is your Bugsnag upload endpoint?"
    When I input "https://upload.example.com" interactively
    And I wait for the current stdout line to contain "What is your Bugsnag build endpoint?"
    When I input "https://build.example.com" interactively
    And I wait for the current stdout line to contain "Do you want to automatically upload source maps as part of the Xcode build?"
    When I press enter
    And I wait for the shell to output the following to stdout
        """
        To configure your project to upload dSYMs, follow the iOS symbolication guide:

        https://docs.bugsnag.com/platforms/ios/symbolication-guide/

        This will enable you to see full native stacktraces. It can't be done automatically.
        """
    And I wait for the current stdout line to contain "Hit enter to continue"
    When I press enter
    And I wait for the current stdout line to contain "Do you want to automatically upload source maps as part of the Gradle build?"
    When I press enter
    And I wait for the current stdout line to contain "If you want the latest version of @bugsnag/source-maps hit enter, otherwise type the version you want"
    When I press enter
    Then I wait for the shell to output a line containing "@bugsnag/source-maps dependency is installed" to stdout
    Then the last interactive command exited successfully
    And bugsnag source maps library is in the package.json file
    And the iOS build has been modified to upload source maps to "https://upload.example.com"
    And the Bugsnag Android Gradle plugin is not installed
    And the Android build has been modified to upload source maps to "https://upload.example.com"
    And the Android build has been modified to upload builds to "https://build.example.com"

Scenario: opt not to modify the Android project
    When I run the React Native service interactively
    And I input "bugsnag-react-native-cli automate-symbolication" interactively
    Then I wait for the shell to output a line containing "No repo detected." to stdout
    And I wait for the shell to output the following to stdout
        """
        This command may make modifications to your project. It is recommended that you commit the
        current status of your code to a git repo before continuing.
        """
    And I wait for the current stdout line to contain "Do you want to continue anyway?"
    When I input "y" interactively
    And I wait for the current stdout line to contain "Are you using Bugsnag on-premise?"
    When I press enter
    And I wait for the current stdout line to contain "Do you want to automatically upload source maps as part of the Xcode build?"
    When I press enter
    And I wait for the shell to output the following to stdout
        """
        To configure your project to upload dSYMs, follow the iOS symbolication guide:

        https://docs.bugsnag.com/platforms/ios/symbolication-guide/

        This will enable you to see full native stacktraces. It can't be done automatically.
        """
    And I wait for the current stdout line to contain "Hit enter to continue"
    When I press enter
    And I wait for the current stdout line to contain "Do you want to automatically upload source maps as part of the Gradle build?"
    When I input "n" interactively
    And I wait for the current stdout line to contain "If you want the latest version of @bugsnag/source-maps hit enter, otherwise type the version you want"
    When I press enter
    Then I wait for the shell to output a line containing "@bugsnag/source-maps dependency is installed" to stdout
    Then the last interactive command exited successfully
    And bugsnag source maps library is in the package.json file
    And the iOS build has been modified to upload source maps
    And the Bugsnag Android Gradle plugin is not installed
    And the Android build has not been modified to upload source maps

Scenario: opt not to modify the iOS project
    When I run the React Native service interactively
    And I input "bugsnag-react-native-cli automate-symbolication" interactively
    Then I wait for the shell to output a line containing "No repo detected." to stdout
    And I wait for the shell to output the following to stdout
        """
        This command may make modifications to your project. It is recommended that you commit the
        current status of your code to a git repo before continuing.
        """
    And I wait for the current stdout line to contain "Do you want to continue anyway?"
    When I input "y" interactively
    And I wait for the current stdout line to contain "Are you using Bugsnag on-premise?"
    When I press enter
    And I wait for the current stdout line to contain "Do you want to automatically upload source maps as part of the Xcode build?"
    When I input "n" interactively
    And I wait for the shell to output the following to stdout
        """
        To configure your project to upload dSYMs, follow the iOS symbolication guide:

        https://docs.bugsnag.com/platforms/ios/symbolication-guide/

        This will enable you to see full native stacktraces. It can't be done automatically.
        """
    And I wait for the current stdout line to contain "Hit enter to continue"
    When I press enter
    And I wait for the current stdout line to contain "Do you want to automatically upload source maps as part of the Gradle build?"
    When I input "y" interactively
    And I wait for the current stdout line to contain "If you want the latest version of @bugsnag/source-maps hit enter, otherwise type the version you want"
    When I press enter
    Then I wait for the shell to output a line containing "@bugsnag/source-maps dependency is installed" to stdout
    Then the last interactive command exited successfully
    And bugsnag source maps library is in the package.json file
    And the iOS build has not been modified to upload source maps
    And the Bugsnag Android Gradle plugin is not installed
    And the Android build has been modified to upload source maps

Scenario: opt not to modify either project
    When I run the React Native service interactively
    And I input "bugsnag-react-native-cli automate-symbolication" interactively
    Then I wait for the shell to output a line containing "No repo detected." to stdout
    And I wait for the shell to output the following to stdout
        """
        This command may make modifications to your project. It is recommended that you commit the
        current status of your code to a git repo before continuing.
        """
    And I wait for the current stdout line to contain "Do you want to continue anyway?"
    When I input "y" interactively
    And I wait for the current stdout line to contain "Are you using Bugsnag on-premise?"
    When I press enter
    And I wait for the current stdout line to contain "Do you want to automatically upload source maps as part of the Xcode build?"
    When I input "n" interactively
    And I wait for the shell to output the following to stdout
        """
        To configure your project to upload dSYMs, follow the iOS symbolication guide:

        https://docs.bugsnag.com/platforms/ios/symbolication-guide/

        This will enable you to see full native stacktraces. It can't be done automatically.
        """
    And I wait for the current stdout line to contain "Hit enter to continue"
    When I press enter
    And I wait for the current stdout line to contain "Do you want to automatically upload source maps as part of the Gradle build?"
    When I input "n" interactively
    Then the last interactive command exited successfully
    And bugsnag source maps library is not in the package.json file
    And the iOS build has not been modified to upload source maps
    And the Bugsnag Android Gradle plugin is not installed
    And the Android build has not been modified to upload source maps
