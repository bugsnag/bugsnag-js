#!/bin/bash

# Download decision files
curl https://raw.githubusercontent.com/bugsnag/license-audit/master/config/decision_files/global.yml -o config/decisions.yml
curl https://raw.githubusercontent.com/bugsnag/license-audit/master/config/decision_files/common-js.yml >> config/decisions.yml
curl https://raw.githubusercontent.com/bugsnag/license-audit/master/config/decision_files/bugsnag-js.yml >> config/decisions.yml

ruby -v

gem install license_finder

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
ruby $SCRIPT_DIR/license_finder.rb
