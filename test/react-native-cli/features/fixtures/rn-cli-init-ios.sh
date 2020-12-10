#!/usr/bin/expect -f

set timeout -1
set notifierVersion [lindex $argv 0];

cd $env(REACT_NATIVE_VERSION)
spawn ./node_modules/bugsnag-react-native-cli/bin/cli init

expect "Do you want to continue anyway?"
send -- "Y\r"

expect "If you want the latest version of @bugsnag/react-native hit enter, otherwise type the version you want"
send -- "$notifierVersion\r"

expect "What is your Bugsnag API key?"
send -- 12312312312312312312312312312312\r

expect "Do you want to automatically upload source maps as part of the Xcode build?"
send -- y

expect "Do you want to automatically upload source maps as part of the Gradle build?"
send -- n

expect "If you want the latest version of @bugsnag/source-maps hit enter, otherwise type the version you want"
send -- latest\r

expect eof
