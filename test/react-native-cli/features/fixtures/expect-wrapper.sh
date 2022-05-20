#!/usr/bin/expect -f

set expecting [lindex $argv 0];
set response [lindex $argv 1];

expect $expecting

send -- $response
