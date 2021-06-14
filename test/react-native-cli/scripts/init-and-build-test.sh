VERSION=$1

function check_status {
  if [[ $1 != 0 ]]; then
    popd
    exit $1
  fi
}

# Build the app within Maze Runner, checking for the source map upload
mkdir -p build
pushd test/react-native-cli
bundle install
REACT_NATIVE_VERSION=$VERSION bundle exec maze-runner features/build-app-tests/build-ios-app.feature

# TODO: Reinstate as part of PLAT-6764
#check_status $?

# Export the IPA separately from MazeRunner (running it inside failed for an unknown reason)
cd features/fixtures
xcrun --log xcodebuild -exportArchive -archivePath "${VERSION}/${VERSION}.xcarchive" -exportPath output -verbose -exportOptionsPlist exportOptions.plist
check_status $?

# Clear the archive away
rm -rf ${VERSION}/${VERSION}.xcarchive

# Copy file to build directory, ensuring the exit code bubbles up
cp output/${VERSION}.ipa ../../../../build
STATUS=$?
popd
exit $STATUS
