#!/bin/bash

set -e

if [ -z "$REACT_NATIVE_VERSION" ]; then
    echo "The environment variable 'REACT_NATIVE_VERSION' must be set"
    exit 1
fi

if [ -z "$REGISTRY_URL" ]; then
    echo "The environment variable 'REGISTRY_URL' must be set"
    exit 1
fi

cp -r test/react-native/features/fixtures/app test/react-native/features/fixtures/$REACT_NATIVE_VERSION/app
cd test/react-native/features/fixtures/$REACT_NATIVE_VERSION

npm i --registry $REGISTRY_URL

node ../../../../../scripts/install.js $REGISTRY_URL

source build.sh

cd ../../../../../
mkdir build
cp test/react-native/features/fixtures/$REACT_NATIVE_VERSION/output/output.ipa build/$REACT_NATIVE_VERSION.ipa