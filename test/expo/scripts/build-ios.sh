#!

set -e

# Lets make sure the build folder was cleared out correctly
rm -rf $BUILDKITE_BUILD_CHECKOUT_PATH/build/*

cd test/expo/features/fixtures/test-app

npm install

./node_modules/.bin/turtle build:ios \
  -c ./app.json \
  --team-id $APPLE_TEAM_ID \
  --dist-p12-path $EXPO_P12_PATH \
  --provisioning-profile-path $EXPO_PROVISIONING_PROFILE_PATH \
  --release-channel $EXPO_RELEASE_CHANNEL \
  -o $BUILDKITE_BUILD_CHECKOUT_PATH/build/output.ipa
