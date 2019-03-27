set -e

EXPO_ANDROID_KEYSTORE_PASSWORD=password \
EXPO_ANDROID_KEY_PASSWORD=password \
turtle build:android \
--keystore-path fakekeys.jks \
--keystore-alias password \
--output ./output.apk