FROM node:lts-alpine

COPY . /app

WORKDIR /app

RUN npm i -g bugsnag-react-native-cli-*.tgz

ENTRYPOINT ["/bin/sh"]
