npm install @bugsnag/plugin-react-navigation@$BUGSNAG_VERSION --registry=$REGISTRY_URL

if [ "$REACT_NATIVE_VERSION" = "rn0.60" ]; then
    npm install @react-native-community/masked-view@^0.1 --registry=$REGISTRY_URL
    npm install @react-navigation/native@^5.9 --registry=$REGISTRY_URL
    npm install @react-navigation/stack@^5.14 --registry=$REGISTRY_URL
    npm install react-native-gesture-handler@^1.10 --registry=$REGISTRY_URL
    npm install react-native-reanimated@^1.13 --registry=$REGISTRY_URL
    npm install react-native-safe-area-context@^3.1 --registry=$REGISTRY_URL
    npm install react-native-screens@^2.18 --registry=$REGISTRY_URL
else
    npm install @react-native-community/masked-view@^0.1 --registry=$REGISTRY_URL
    npm install @react-navigation/native@^6.0 --registry=$REGISTRY_URL
    npm install @react-navigation/stack@^6.0 --registry=$REGISTRY_URL
    npm install react-native-gesture-handler@^2.2 --registry=$REGISTRY_URL
    npm install react-native-reanimated@^1.13 --registry=$REGISTRY_URL
    npm install react-native-safe-area-context@3.3 --registry=$REGISTRY_URL
    npm install react-native-screens@3.10 --registry=$REGISTRY_URL
fi
