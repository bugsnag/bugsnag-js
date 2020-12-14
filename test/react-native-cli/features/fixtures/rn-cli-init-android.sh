#!/usr/bin/expect -f

set timeout -1
set notifierVersion [lindex $argv 0];

puts "Using notifier version: $notifierVersion"

cd $env(REACT_NATIVE_VERSION)
spawn ./node_modules/bugsnag-react-native-cli/bin/cli init

expect "Do you want to continue anyway?"
send -- "Y\r"

expect "If you want the latest version of @bugsnag/react-native hit enter, otherwise type the version you want"
send -- $notifierVersion\r

# TODO: Use latest once BAGP is released for real
expect "If you want the latest version of the Bugsnag Android Gradle plugin hit enter, otherwise type the version you want"
send -- 5.5.0-alpha01\r

expect "What is your Bugsnag API key?"
send -- b161f2dbabe3204527bbe5ed4b9334a4\r

expect "What is your Bugsnag notify endpoint?"
send -- http://bs-local.com:9339\r

expect "What is your Bugsnag sessions endpoint?"
send -- http://bs-local.com:9339\r

expect "Do you want to automatically upload source maps as part of the Xcode build?"
send -- n

expect "Do you want to automatically upload source maps as part of the Gradle build?"
send -- n

# TODO: Disable source map uploads for now
#expect "If you want the latest version of @bugsnag/source-maps hit enter, otherwise type the version you want"
#send -- latest\r

expect eof
