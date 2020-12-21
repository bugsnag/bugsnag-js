#!/bin/sh

echo "Building test fixture for iOS"
node -e 'require("./scripts/react-native-cli-helper").buildIOS()'
