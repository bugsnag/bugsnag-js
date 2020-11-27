if [ "$#" -ne 1 ]
then
  echo 'Usage: build-ios.sh <react native project directory>'
  exit 1
fi

cd $1 || exit 1

rm -rf "$1.xcarchive"

cd ios || exit 1
pod install | pod install --repo-update
xcrun xcodebuild \
  -scheme "$1" \
  -workspace "$1.xcworkspace" \
  -configuration Release \
  -archivePath "../$1.xcarchive" \
  -allowProvisioningUpdates \
  -quiet \
  archive

cd ..

xcrun xcodebuild -exportArchive \
  -archivePath "$1.xcarchive" \
  -exportPath ../output/ \
  -quiet \
  -exportOptionsPlist ../exportOptions.plist

rm -rf "$1.xcarchive"
