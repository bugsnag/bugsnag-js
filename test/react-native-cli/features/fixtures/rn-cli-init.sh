#!/usr/bin/expect -f
set timeout -1
set notifierVersion [lindex $argv 0];
set rnVersion [lindex $argv 1];
set platform [lindex $argv 2]

puts "Using notifier version: $notifierVersion"
puts "Using React Native version: $rnVersion"

cd $rnVersion
spawn ./node_modules/.bin/bugsnag-react-native-cli init

expect "Do you want to continue anyway?"
send -- "Y"

expect "Are you using Bugsnag on-premise?"
send -- "Y"

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
send -- "1234567890ABCDEF1234567890ABCDEF\r"

if { $platform == "IOS" } {
  expect "Do you want to automatically upload JavaScript source maps as part of the Xcode build?"
  send -- y
}

if { $platform == "Android" } {
  expect "Do you want to automatically upload JavaScript source maps as part of the Xcode build?"
  send -- n
}

expect "This will enable you to see full native stacktraces. It can't be done automatically."
send -- \r

if { $platform == "IOS" } {
  expect "Do you want to automatically upload JavaScript source maps as part of the Gradle build?"
  send -- n
}

if { $platform == "Android" } {
  expect "Do you want to automatically upload JavaScript source maps as part of the Gradle build?"
  send -- y
}

expect "If you want the latest version of @bugsnag/source-maps hit enter, otherwise type the version you want"
send -- latest\r

expect eof
