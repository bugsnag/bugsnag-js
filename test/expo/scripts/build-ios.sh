#!

set -e

# Lets make sure the build folder was cleared out correctly
rm -rf $BUILDKITE_BUILD_CHECKOUT_PATH/build/*
cd test/expo/features/fixtures/test-app
npm i turtle-cli@0.13.1 bunyan
perl -0777 -i.original -pe "s/entitlements\\['aps-environment'\\] =[^;]+;//gs" node_modules/turtle-cli/node_modules/xdl/build/detach/IosNSBundle.js
node_modules/.bin/turtle build:ios \
  -c ./app.json \
  --team-id $APPLE_TEAM_ID \
  --dist-p12-path $EXPO_P12_PATH \
  --provisioning-profile-path $EXPO_PROVISIONING_PROFILE_PATH \
  --release-channel $EXPO_RELEASE_CHANNEL \
  -o $BUILDKITE_BUILD_CHECKOUT_PATH/build/output.ipa
