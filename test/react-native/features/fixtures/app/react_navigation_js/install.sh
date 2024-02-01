npm install @bugsnag/plugin-react-navigation@$BUGSNAG_VERSION --registry=$REGISTRY_URL

if [ "$REACT_NATIVE_VERSION" = "rn0.66" ] || [ "$REACT_NATIVE_VERSION" = "rn0.67" ] || [ "$REACT_NATIVE_VERSION" = "rn0.68-hermes" ]; then
    npm install @react-native-community/masked-view@^0.1 --registry=$REGISTRY_URL
    npm install @react-navigation/native@^6.0 --registry=$REGISTRY_URL
    npm install @react-navigation/stack@^6.0 --registry=$REGISTRY_URL
    # gesture-handler locked to avoid Kotlin version conflicts, see "Important changes" at:
    # https://github.com/software-mansion/react-native-gesture-handler/releases/tag/2.7.0
    npm install react-native-gesture-handler@2.6.2 --registry=$REGISTRY_URL
    npm install react-native-reanimated@^1.13 --registry=$REGISTRY_URL
    npm install react-native-safe-area-context@3.3 --registry=$REGISTRY_URL
    npm install react-native-screens@3.10 --registry=$REGISTRY_URL
else
  npm install @react-native-community/masked-view@^0.1 --registry=$REGISTRY_URL
      npm install @react-navigation/native@^6.0 --registry=$REGISTRY_URL
      npm install @react-navigation/stack@^6.0 --registry=$REGISTRY_URL
      npm install react-native-gesture-handler@^2.2 --registry=$REGISTRY_URL
      npm install react-native-reanimated@^1.13 --registry=$REGISTRY_URL
      npm install react-native-safe-area-context@3.3 --registry=$REGISTRY_URL
      npm install react-native-screens@3.10 --registry=$REGISTRY_URL
fi
