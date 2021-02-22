#!/usr/bin/env bash
set -e

ANDROID_REPO_DIR=../../../bugsnag-android
MAVEN_REPO_DIR=~/.m2/repository/com/bugsnag
AAR_DST=android/com/bugsnag

# artefact version needs to be unique to avoid clash with bugsnag-android artefacts
# deployed on mavenCentral/jcenter, append a 'react-native' suffix
ANDROID_VERSION=$(cat $ANDROID_REPO_DIR/gradle.properties | grep VERSION_NAME)
AMENDED_VERSION="${ANDROID_VERSION#*=}-react-native"

echo "Clearing local maven repo"
rm -rf $MAVEN_REPO_DIR

echo "Building local copy of bugsnag-android $AMENDED_VERSION"
./$ANDROID_REPO_DIR/gradlew -p $ANDROID_REPO_DIR clean assembleRelease publishToMavenLocal -PVERSION_NAME=$AMENDED_VERSION

echo "Removing previous AARs from bugsnag-js"
rm -rf $AAR_DST

echo "Copying new AARs to bugsnag-js"
cp -r $MAVEN_REPO_DIR $AAR_DST

echo "Recording version"
rm -rf ./android/.bugsnag-android-version
echo $(cd $ANDROID_REPO_DIR && git rev-parse HEAD) >> ./android/.bugsnag-android-version

sed -i '' "s/api \"com.bugsnag:bugsnag-android:.*/api \"com.bugsnag:bugsnag-android:$AMENDED_VERSION\"/" android/build.gradle
sed -i '' "s/api \"com.bugsnag:bugsnag-plugin-react-native:.*/api \"com.bugsnag:bugsnag-plugin-react-native:$AMENDED_VERSION\"/" android/build.gradle
