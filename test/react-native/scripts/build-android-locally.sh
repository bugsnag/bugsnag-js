set -e

docker-compose build react-native-android-builder
docker-compose run react-native-android-builder
docker-compose build react-native-maze-runner
