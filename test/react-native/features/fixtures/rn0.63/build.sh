npm i
cd ios && pod install
xcrun xcodebuild \
  -scheme reactnative \
  -workspace reactnative.xcworkspace \
  -configuration Release \
  -archivePath ../reactnative.xcarchive \
  -allowProvisioningUpdates \
  -quiet \
  archive

cd ..

xcrun xcodebuild -exportArchive \
  -archivePath reactnative.xcarchive \
  -exportPath output/ \
  -quiet \
  -exportOptionsPlist exportOptions.plist

mv output/reactnative.ipa output/output.ipa