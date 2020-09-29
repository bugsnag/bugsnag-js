npm i react-native-navigation@^7.0.0
npx rnn-link

find ./ios/reactnative.xcodeproj/project.pbxproj -type f -exec sed -i '' -e "s/IPHONEOS_DEPLOYMENT_TARGET = [^ ;]*;/IPHONEOS_DEPLOYMENT_TARGET = 11.0;/g" {} \;