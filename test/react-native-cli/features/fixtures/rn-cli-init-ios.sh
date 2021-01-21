#!/usr/bin/expect -f

set timeout -1
set notifierVersion [lindex $argv 0];
set rnVersion [lindex $argv 1];

puts "Using notifier version: $notifierVersion"
puts "Using React Native version: $rnVersion"

cd $rnVersion
spawn ./node_modules/.bin/bugsnag-react-native-cli init

expect "Do you want to continue anyway?"
send -- "Y"

expect "Are you using Bugsnag on-premise?"
send -- "Y"

expect "What is your Bugsnag notify endpoint?"
send -- http://bs-local.com:9339\r

expect "What is your Bugsnag sessions endpoint?"
send -- http://bs-local.com:9339\r

expect "What is your Bugsnag upload endpoint?"
send -- http://localhost:9339\r

expect "What is your Bugsnag build endpoint?"
send -- http://localhost:9339\r

expect "If you want the latest version of @bugsnag/react-native hit enter, otherwise type the version you want"
send -- $notifierVersion\r

# TODO: Use latest once BAGP is released for real
expect "If you want the latest version of the Bugsnag Android Gradle plugin hit enter, otherwise type the version you want"
send -- "5.5.0-alpha01\r"

expect "What is your Bugsnag project API key?"
send -- "1234567890ABCDEF1234567890ABCDEF\r"

expect "Do you want to automatically upload JavaScript source maps as part of the Xcode build?"
send -- y

expect "This will enable you to see full native stacktraces. It can't be done automatically."
send -- \r

expect "Do you want to automatically upload JavaScript source maps as part of the Gradle build?"
send -- n

expect "If you want the latest version of @bugsnag/source-maps hit enter, otherwise type the version you want"
send -- latest\r

expect eof
