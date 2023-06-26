#!/usr/bin/expect -f

set timeout -1
set notifierVersion [lindex $argv 0];
set rnVersion [lindex $argv 1];
set rnVersionInt ""

# Extract the substring starting from the third character
set rnVersionInt [string range $rnVersion 2 end]

# Replace underscore (_) with a period (.)
set rnVersionInt2 [string map {_ .} $rnVersionInt]

# Convert float string to float value using bc
regsub -all {^0+} $rnVersionInt2 "" $rnVersionInt2

puts "Using notifier version: $notifierVersion"
puts "Using React Native version: $rnVersion"

cd $rnVersion
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
send -- http://localhost:9339/builds\r

expect "What is your Bugsnag build endpoint?"
send -- http://localhost:9339/builds\r

expect "If you want the latest version of @bugsnag/react-native hit enter, otherwise type the version you want"
send -- $notifierVersion\r

expect "Enter version of the Bugsnag Android Gradle plugin you want to use"
send -- \r

expect "What is your Bugsnag project API key?"
send -- 1234567890ABCDEF1234567890ABCDEF\r

expect "Do you want to automatically upload JavaScript source maps as part of the Xcode build?"
send -- n

expect "This will enable you to see full native stacktraces. It can't be done automatically."
send -- \r

expect "Do you want to install the BugSnag CLI to allow you to upload JavaScript source maps?"
send -- y

expect "If you want the latest version of @bugsnag/cli hit enter, otherwise type the version you want"
send -- latest\r

if {[expr $rnVersionInt2 < 0.68]} {
   expect "or follow the manual integration instructions in our online docs: https://docs.bugsnag.com/platforms/react-native/react-native/manual-setup/')"
   send -- \r
}

expect eof
