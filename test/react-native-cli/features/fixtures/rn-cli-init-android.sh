#!/usr/bin/expect -f

set timeout -1
set notifierVersion [lindex $argv 0];

puts "Using notifier version: $notifierVersion"

cd $env(REACT_NATIVE_VERSION)
spawn ./node_modules/bugsnag-react-native-cli/bin/cli init

expect "Do you want to continue anyway?"
send -- "Y\r"

expect "Are you using Bugsnag on-premise?"
send -- "Y\r"

expect "What is your Bugsnag notify endpoint?"
send -- http://bs-local.com:9339\r

expect "What is your Bugsnag sessions endpoint?"
send -- http://bs-local.com:9339\r

expect "What is your Bugsnag upload endpoint?"
send -- http://bs-local.com:9339\r

expect "What is your Bugsnag build endpoint?"
send -- http://bs-local.com:9339\r

expect "If you want the latest version of @bugsnag/react-native hit enter, otherwise type the version you want"
send -- $notifierVersion\r

# TODO: Use latest once BAGP is released for real
expect "If you want the latest version of the Bugsnag Android Gradle plugin hit enter, otherwise type the version you want"
send -- 5.5.0-alpha01\r

# TODO: Use the usual 123123... test API key
expect "What is your Bugsnag API key?"
send -- b161f2dbabe3204527bbe5ed4b9334a4\r

expect "Do you want to automatically upload source maps as part of the Xcode build?"
send -- n

expect "This will enable you to see full native stacktraces. It can't be done automatically."
send -- \r

expect "Do you want to automatically upload source maps as part of the Gradle build?"
send -- y

expect "If you want the latest version of @bugsnag/source-maps hit enter, otherwise type the version you want"
send -- latest\r

expect eof
