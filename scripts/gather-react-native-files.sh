#!/bin/bash

# TODO This script doesn't need to exist - just use a multiple stage Docker build

echo "Installing Node using NVM"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install node

echo "Gathering files on Docker host needed for React Native Docker build"
node -e 'require("./scripts/react-native-helper.js").gather("test/react-native/features/fixtures", "docker-temp/fixtures")'
