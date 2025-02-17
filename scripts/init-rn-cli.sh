#!/usr/bin/expect -f

# Set infinite timeout to avoid script termination due to delays
set timeout -1

# Read command-line arguments
set notifier_version [lindex $argv 0]
set rn_version [lindex $argv 1]
set fixture_path [lindex $argv 2]

# Process React Native version string
set rn_version_cleaned [string map {".expo.ejected" "" "_" "."} [string range $rn_version 2 end]]

# Remove leading zeros if any
regsub -all {^0+} $rn_version_cleaned "" rn_version_cleaned

cd $fixture_path

# Start the Bugsnag React Native CLI initialization
spawn ./node_modules/.bin/bugsnag-react-native-cli init

# Handle CLI prompts
expect "Do you want to continue anyway?" { send -- "Y\r" }
expect "Are you using Bugsnag on-premise?" { send -- "Y\r" }
expect "What is your Bugsnag notify endpoint?" { send -- "http://bs-local.com:9339/notify\r" }
expect "What is your Bugsnag sessions endpoint?" { send -- "http://bs-local.com:9339/sessions\r" }
expect "What is your Bugsnag upload endpoint?" { send -- "http://localhost:9339\r" }
expect "What is your Bugsnag build endpoint?" { send -- "http://localhost:9339/builds\r" }
expect "If you want the latest version of @bugsnag/react-native hit enter, otherwise type the version you want" { send -- "$notifier_version\r" }
#expect "Enter version of the Bugsnag Android Gradle plugin you want to use" { send -- "\r" }
expect "What is your Bugsnag project API key?" { send -- "1234567890ABCDEF1234567890ABCDEF\r" }
expect "Do you want to install the BugSnag CLI to allow you to upload JavaScript source maps?" { send -- "Y\r" }
expect "If you want the latest version of @bugsnag/cli hit enter, otherwise type the version you want" { send -- "3.0.0-beta.0\r" }
expect "See https://docs.bugsnag.com/platforms/react-native/react-native/showing-full-stacktraces for details." { send -- "\r" }
expect "Do you want to update your Xcode build phase to output JavaScript source maps?" { send -- "Y\r" }
expect "This will enable you to see full native stacktraces. It can't be done automatically." { send -- "\r" }

# Ensure proper script termination
expect eof
