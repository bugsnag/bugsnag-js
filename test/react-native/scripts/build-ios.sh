#!

if [ -z "$REACT_NATIVE_VERSION" ]; then
    echo "The environment variable 'REACT_NATIVE_VERSION' must be set"
    exit 1
fi

cp -r test/react-native/features/fixtures/app test/react-native/features/fixtures/$REACT_NATIVE_VERSION/app
cd test/react-native/features/fixtures/$REACT_NATIVE_VERSION
source build.sh

cd ../../../../../
mkdir build
cp test/react-native/features/fixtures/$REACT_NATIVE_VERSION/output/output.ipa build/$REACT_NATIVE_VERSION.ipa