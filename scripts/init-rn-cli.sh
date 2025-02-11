#!/usr/bin/expect -f

set timeout -1
set notifierVersion [lindex $argv 0];
set rnVersion [lindex $argv 1];
set fixturePath [lindex $argv 2];
set rnVersionInt ""
set substringToTrim ".expo.ejected"

# Extract the substring starting from the third character
set rnVersionInt [string range $rnVersion 2 end]

# Replace underscore (_) with a period (.)
set rnVersionInt2 [string map {_ .} $rnVersionInt]

set rnVersionInt3 [string map [list $substringToTrim ""] $rnVersionInt2]

# Convert float string to float value using bc
regsub -all {^0+} $rnVersionInt3 "" $rnVersionInt3

puts "Using notifier version: $notifierVersion"
puts "Using React Native version: $rnVersion"

cd $fixturePath
spawn ./node_modules/.bin/bugsnag-react-native-cli init

expect "Do you want to continue anyway?"
send -- "Y\r"

expect "Are you using Bugsnag on-premise?"
send -- "Y\r"

expect "What is your Bugsnag notify endpoint?"
send -- http://bs-local.com:9339/notify\r

expect "What is your Bugsnag sessions endpoint?"
send -- http://bs-local.com:9339/sessions\r

expect "What is your Bugsnag upload endpoint?"
send -- http://localhost:9339\r

expect "What is your Bugsnag build endpoint?"
send -- http://localhost:9339/builds\r

expect "Enter version of the Bugsnag Android Gradle plugin you want to use"
send -- r

expect "What is your Bugsnag project API key?"
send -- "1234567890ABCDEF1234567890ABCDEF\r"

expect "Do you want to install the BugSnag CLI to allow you to upload JavaScript source maps?"
send -- y

expect "If you want the latest version of @bugsnag/cli hit enter, otherwise type the version you want"
send -- r

expect "See https://docs.bugsnag.com/platforms/react-native/react-native/showing-full-stacktraces for details."
send -- r

expect "Do you want to update your Xcode build phase to output JavaScript source maps?"
send -- y

expect "This will enable you to see full native stacktraces. It can't be done automatically."
send -- r

expect eof
