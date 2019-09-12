npm i

# Install and configure glog
cd node_modules/react-native
./scripts/ios-install-third-party.sh
cd third-party/glog-0.3.*/
../../scripts/ios-configure-glog.sh
cd ../../../../

./node_modules/.bin/react-native link

cd ios

xcrun xcodebuild \
  -scheme rn055 \
  -project rn055.xcodeproj \
  -configuration Release \
  -archivePath ../rn055.xcarchive \
  -allowProvisioningUpdates \
  -quiet \
  archive

cd ..

xcrun xcodebuild -exportArchive \
  -archivePath rn055.xcarchive \
  -exportPath output/ \
  -quiet \
  -exportOptionsPlist exportOptions.plist

mv output/rn055.ipa output/output.ipa