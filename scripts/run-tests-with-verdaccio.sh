#!/usr/local/env bash
# Runs the unit and integration tests, managing an instance of verdaccio as
# the source for the @bugsnag/electron packages

# run the unit tests
npm run test:unit

# start a local NPM server
npm run local-npm:start 1>/dev/null &
sleep 3 # add some boot time

# log in to the local server (this is a no-op after the first time)
npm run local-npm:login

# run the integration tests
npm run test:cucumber
