expo login -u $EXPO_USERNAME -p $EXPO_PASSWORD
expo publish

rm -rf ../packages
mkdir ../packages

cp fakekeys.jks app.json build-android.sh ../packages/

cd ../packages

./build-android.sh