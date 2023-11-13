npm install @bugsnag/plugin-react-navigation@$BUGSNAG_VERSION --legacy-peer-deps --registry=$REGISTRY_URL

if [ "$REACT_NATIVE_VERSION" = "rn0.60" ]; then
    npm install @react-native-community/masked-view@^0.1 --legacy-peer-deps --registry=$REGISTRY_URL
    npm install @react-navigation/native@^5.9 --legacy-peer-deps --registry=$REGISTRY_URL
    npm install @react-navigation/stack@^5.14 --legacy-peer-deps --registry=$REGISTRY_URL
    npm install react-native-gesture-handler@^1.10 --legacy-peer-deps --registry=$REGISTRY_URL
    npm install react-native-reanimated@^1.13 --legacy-peer-deps --registry=$REGISTRY_URL
    npm install react-native-safe-area-context@^3.1 --legacy-peer-deps --registry=$REGISTRY_URL
    npm install react-native-screens@^2.18 --legacy-peer-deps --registry=$REGISTRY_URL
elif [ "$REACT_NATIVE_VERSION" = "rn0.66" ] || [ "$REACT_NATIVE_VERSION" = "rn0.67" ] || [ "$REACT_NATIVE_VERSION" = "rn0.68-hermes" ]; then
    npm install @react-native-community/masked-view@^0.1 --legacy-peer-deps --registry=$REGISTRY_URL
    npm install @react-navigation/native@^6.0 --legacy-peer-deps --registry=$REGISTRY_URL
    npm install @react-navigation/stack@^6.0 --legacy-peer-deps --registry=$REGISTRY_URL
    # gesture-handler locked to avoid Kotlin version conflicts, see "Important changes" at:
    # https://github.com/software-mansion/react-native-gesture-handler/releases/tag/2.7.0
    npm install react-native-gesture-handler@2.6.2 --legacy-peer-deps --registry=$REGISTRY_URL
    npm install react-native-reanimated@^1.13 --legacy-peer-deps --registry=$REGISTRY_URL
    npm install react-native-safe-area-context@3.3 --legacy-peer-deps --registry=$REGISTRY_URL
    npm install react-native-screens@3.10 --legacy-peer-deps --registry=$REGISTRY_URL
else
  npm install @react-native-community/masked-view@^0.1 --legacy-peer-deps --registry=$REGISTRY_URL
      npm install @react-navigation/native@^6.0 --legacy-peer-deps --registry=$REGISTRY_URL
      npm install @react-navigation/stack@^6.0 --legacy-peer-deps --registry=$REGISTRY_URL
      npm install react-native-gesture-handler@^2.2 --legacy-peer-deps --registry=$REGISTRY_URL
      npm install react-native-reanimated@^1.13 --legacy-peer-deps --registry=$REGISTRY_URL
      npm install react-native-safe-area-context@3.3 --legacy-peer-deps --registry=$REGISTRY_URL
      npm install react-native-screens@3.10 --legacy-peer-deps --registry=$REGISTRY_URL
fi
