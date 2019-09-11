#!
cd test/expo/features/fixtures/test-app && \
npm i turtle-cli bunyan && \
perl -0777 -i.original -pe "s/entitlements\\['aps-environment'\\] =[^;]+;//gs" node_modules/turtle-cli/node_modules/xdl/build/detach/IosNSBundle.js && \
node_modules/.bin/turtle build:ios \
  -c test/expo/features/fixtures/test-app/app.json \
  --team-id $APPLE_TEAM_ID \
  --dist-p12-path $EXPO_P12_PATH \
  --provisioning-profile-path $EXPO_PROVISIONING_PROFILE_PATH \
  --release-channel $EXPO_RELEASE_CHANNEL \
  -o build/output.ipa

docker-compose build expo-maze-runner