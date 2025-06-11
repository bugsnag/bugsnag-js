rm -rf reactnative.xcarchive

cd ios
bundle install
rm -rf Pods Podfile.lock
bundle exec pod deintegrate
bundle exec pod install --repo-update
bundle exec pod install

xcodebuild clean

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

rm -rf reactnative.xcarchive
