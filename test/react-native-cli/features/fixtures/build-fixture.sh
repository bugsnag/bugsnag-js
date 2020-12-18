#!/bin/sh
SYSTEM=$(uname -s)

if [ "$SYSTEM" == "Darwin" ]; then
  echo "Building test fixture for iOS"
  node -e 'require("./scripts/react-native-cli-helper").buildIOS()'
else
  echo "Building test fixture for Android"
  node -e 'require("./scripts/react-native-cli-helper").buildAndroid("/app/test/react-native-cli/features/fixtures", "/app/features/fixtures")'
fi
