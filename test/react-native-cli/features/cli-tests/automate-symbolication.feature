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
    And I wait for the current stdout line to match the regex "Do you want to install the BugSnag CLI to allow you to upload JavaScript source maps\?"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "If you want the latest version of @bugsnag/cli hit enter, otherwise type the version you want"
    When I input a return interactively
    Then I wait for the shell to output a match for the regex "@bugsnag/cli dependency is installed" to stdout
    When RN version is 0.68 or lower dismiss the warning message
    And I wait for the interactive shell to output the following lines in stdout
        """
        The following tasks have been added to your package.json and can be run after a build to upload source maps to BugSnag:

        bugsnag:create-build              - Creates a new build
        bugsnag:upload-android-ndk        - Uploads Android NDK source maps
        bugsnag:upload-android-proguard   - Uploads Android Proguard source maps
        bugsnag:upload-rn-android         - Uploads React Native Android source maps
        bugsnag:upload-dsym               - Uploads iOS dSYMs
        bugsnag:upload-rn-ios             - Uploads React Native iOS source maps
        bugsnag:upload                    - Runs all of the above tasks

        See https://docs.bugsnag.com/platforms/react-native/react-native/showing-full-stacktraces for details.
        """
    And I wait for the current stdout line to match the regex "Hit enter to continue"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "Do you want to update your Xcode build phase to output JavaScript source maps\?"
    When I input "y" interactively
    And I wait for the interactive shell to output the following lines in stdout
        """
        To configure your project to upload dSYMs, follow the iOS symbolication guide:

        https://docs.bugsnag.com/platforms/ios/symbolication-guide/

        This will enable you to see full native stacktraces. It can't be done automatically.
        """
    And I wait for the current stdout line to match the regex "Hit enter to continue"
    When I input a return interactively
    Then the last interactive command exited successfully
    And the iOS build has been modified to upload source maps
    And the Bugsnag Android Gradle plugin is not installed
    And the Android build has been modified to upload source maps

Scenario: successfully modify project, choosing bugsnag-cli version
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
    And I wait for the current stdout line to match the regex "Do you want to install the BugSnag CLI to allow you to upload JavaScript source maps\?"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "If you want the latest version of @bugsnag/cli hit enter, otherwise type the version you want"
    When I input "1.2.0" interactively
    Then I wait for the shell to output a match for the regex "@bugsnag/cli dependency is installed" to stdout
    When RN version is 0.68 or lower dismiss the warning message
    And I wait for the interactive shell to output the following lines in stdout
        """
        The following tasks have been added to your package.json and can be run after a build to upload source maps to BugSnag:

        bugsnag:create-build              - Creates a new build
        bugsnag:upload-android-ndk        - Uploads Android NDK source maps
        bugsnag:upload-android-proguard   - Uploads Android Proguard source maps
        bugsnag:upload-rn-android         - Uploads React Native Android source maps
        bugsnag:upload-dsym               - Uploads iOS dSYMs
        bugsnag:upload-rn-ios             - Uploads React Native iOS source maps
        bugsnag:upload                    - Runs all of the above tasks

        See https://docs.bugsnag.com/platforms/react-native/react-native/showing-full-stacktraces for details.
        """
    And I wait for the current stdout line to match the regex "Hit enter to continue"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "Do you want to update your Xcode build phase to output JavaScript source maps\?"
    When I input "y" interactively
    And I wait for the interactive shell to output the following lines in stdout
        """
        To configure your project to upload dSYMs, follow the iOS symbolication guide:

        https://docs.bugsnag.com/platforms/ios/symbolication-guide/

        This will enable you to see full native stacktraces. It can't be done automatically.
        """
    And I wait for the current stdout line to match the regex "Hit enter to continue"
    When I input a return interactively
    Then the last interactive command exited successfully
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
    And I wait for the current stdout line to match the regex "Do you want to install the BugSnag CLI to allow you to upload JavaScript source maps\?"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "If you want the latest version of @bugsnag/cli hit enter, otherwise type the version you want"
    When I input a return interactively
    Then I wait for the shell to output a match for the regex "@bugsnag/cli dependency is installed" to stdout
    When RN version is 0.68 or lower dismiss the warning message
    And I wait for the interactive shell to output the following lines in stdout
        """
        The following tasks have been added to your package.json and can be run after a build to upload source maps to BugSnag:

        bugsnag:create-build              - Creates a new build
        bugsnag:upload-android-ndk        - Uploads Android NDK source maps
        bugsnag:upload-android-proguard   - Uploads Android Proguard source maps
        bugsnag:upload-rn-android         - Uploads React Native Android source maps
        bugsnag:upload-dsym               - Uploads iOS dSYMs
        bugsnag:upload-rn-ios             - Uploads React Native iOS source maps
        bugsnag:upload                    - Runs all of the above tasks

        See https://docs.bugsnag.com/platforms/react-native/react-native/showing-full-stacktraces for details.
        """
    And I wait for the current stdout line to match the regex "Hit enter to continue"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "Do you want to update your Xcode build phase to output JavaScript source maps\?"
    When I input "y" interactively
    And I wait for the interactive shell to output the following lines in stdout
        """
        To configure your project to upload dSYMs, follow the iOS symbolication guide:

        https://docs.bugsnag.com/platforms/ios/symbolication-guide/

        This will enable you to see full native stacktraces. It can't be done automatically.
        """
    And I wait for the current stdout line to match the regex "Hit enter to continue"
    When I input a return interactively
    Then the last interactive command exited successfully
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
    And I wait for the current stdout line to match the regex "Do you want to install the BugSnag CLI to allow you to upload JavaScript source maps\?"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "If you want the latest version of @bugsnag/cli hit enter, otherwise type the version you want"
    When I input a return interactively
    Then I wait for the shell to output a match for the regex "@bugsnag/cli dependency is installed" to stdout
    When RN version is 0.68 or lower dismiss the warning message
    And I wait for the interactive shell to output the following lines in stdout
        """
        The following tasks have been added to your package.json and can be run after a build to upload source maps to BugSnag:

        bugsnag:create-build              - Creates a new build
        bugsnag:upload-android-ndk        - Uploads Android NDK source maps
        bugsnag:upload-android-proguard   - Uploads Android Proguard source maps
        bugsnag:upload-rn-android         - Uploads React Native Android source maps
        bugsnag:upload-dsym               - Uploads iOS dSYMs
        bugsnag:upload-rn-ios             - Uploads React Native iOS source maps
        bugsnag:upload                    - Runs all of the above tasks

        See https://docs.bugsnag.com/platforms/react-native/react-native/showing-full-stacktraces for details.
        """
    And I wait for the current stdout line to match the regex "Hit enter to continue"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "Do you want to update your Xcode build phase to output JavaScript source maps\?"
    When I input "y" interactively
    And I wait for the interactive shell to output the following lines in stdout
        """
        To configure your project to upload dSYMs, follow the iOS symbolication guide:

        https://docs.bugsnag.com/platforms/ios/symbolication-guide/

        This will enable you to see full native stacktraces. It can't be done automatically.
        """
    And I wait for the current stdout line to match the regex "Hit enter to continue"
    When I input a return interactively
    Then the last interactive command exited successfully
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
    And I wait for the current stdout line to match the regex "Do you want to install the BugSnag CLI to allow you to upload JavaScript source maps\?"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "If you want the latest version of @bugsnag/cli hit enter, otherwise type the version you want"
    When I input a return interactively
    Then I wait for the shell to output a match for the regex "@bugsnag/cli dependency is installed" to stdout
    When RN version is 0.68 or lower dismiss the warning message
    And I wait for the interactive shell to output the following lines in stdout
        """
        The following tasks have been added to your package.json and can be run after a build to upload source maps to BugSnag:

        bugsnag:create-build              - Creates a new build
        bugsnag:upload-android-ndk        - Uploads Android NDK source maps
        bugsnag:upload-android-proguard   - Uploads Android Proguard source maps
        bugsnag:upload-rn-android         - Uploads React Native Android source maps
        bugsnag:upload-dsym               - Uploads iOS dSYMs
        bugsnag:upload-rn-ios             - Uploads React Native iOS source maps
        bugsnag:upload                    - Runs all of the above tasks

        See https://docs.bugsnag.com/platforms/react-native/react-native/showing-full-stacktraces for details.
        """
    And I wait for the current stdout line to match the regex "Hit enter to continue"
    When I input a return interactively
    And I wait for the current stdout line to match the regex "Do you want to update your Xcode build phase to output JavaScript source maps\?"
    When I input "n" interactively
    Then the last interactive command exited successfully
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
    And I wait for the current stdout line to match the regex "Do you want to install the BugSnag CLI to allow you to upload JavaScript source maps\?"
    When I input "n" interactively
    And I wait for the current stdout line to match the regex "\/app #"
    Then the last interactive command exited successfully
    And the iOS build has not been modified to upload source maps
    And the Bugsnag Android Gradle plugin is not installed
    And the Android build has not been modified to upload source maps
