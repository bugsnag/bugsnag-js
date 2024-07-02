#!/bin/bash

npm i @bugsnag/plugin-react-native-navigation@$BUGSNAG_VERSION --legacy-peer-deps --registry=$REGISTRY_URL

if [ "$REACT_NATIVE_VERSION" == "rn0.60" ]; then
   npm i react-native-navigation@7.0.0 --legacy-peer-deps 
elif [ "$REACT_NATIVE_VERSION" == "rn0.66" ]; then
   npm i react-native-navigation@7.29.1 --legacy-peer-deps 
else
   npm i react-native-navigation@^7.30.0 --legacy-peer-deps 
fi

npx rnn-link
