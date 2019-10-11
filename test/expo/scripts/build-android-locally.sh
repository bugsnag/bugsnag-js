set -e

export EXPO_RELEASE_CHANNEL=local
docker-compose up --build expo-publisher
docker-compose up --build expo-android-builder
docker-compose build expo-maze-runner
