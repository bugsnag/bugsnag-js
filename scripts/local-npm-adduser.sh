#!/usr/bin/env bash

expect <<!
spawn npm adduser \-\-registry "http://0.0.0.0:5539"
expect {
  "Username:" {send "localpub\r"; exp_continue}
  "Password:" {send "pawo\r"; exp_continue}
  "Email: (this IS public)" {send "user@example.com\r"; exp_continue}
}
!
