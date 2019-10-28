set -e

export EXPO_RELEASE_CHANNEL=local
docker-compose build expo-publisher
docker-compose run expo-publisher
docker-compose build expo-android-builder
docker-compose run expo-android-builder
docker-compose build expo-maze-runner
