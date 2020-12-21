#!/bin/sh

echo "Building test fixture for Android"
node -e 'require("./scripts/react-native-cli-helper").buildAndroid("/app/features/fixtures", "/app/fixture_build")'
