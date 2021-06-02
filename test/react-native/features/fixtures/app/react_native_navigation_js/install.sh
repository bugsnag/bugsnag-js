#!/bin/bash

npm i @bugsnag/plugin-react-native-navigation@$BUGSNAG_VERSION --registry=$REGISTRY_URL

if [ "$REACT_NATIVE_VERSION" == "rn0.60" ];
then
   npm i react-native-navigation@7.0.0
else
   npm i react-native-navigation@^7.15.0
fi

npx rnn-link
