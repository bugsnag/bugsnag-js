#!/bin/bash

npm i @bugsnag/plugin-react-native-navigation@$BUGSNAG_VERSION --registry=$REGISTRY_URL

if [ "$REACT_NATIVE_VERSION" == "rn0.66" ]; then
   npm i react-native-navigation@7.29.1
else
   npm i react-native-navigation@^7.30.0
fi

npx rnn-link
