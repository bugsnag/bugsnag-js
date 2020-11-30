FROM node:lts-alpine

RUN apk add git

COPY . /app

WORKDIR /app

RUN npm i -g bugsnag-react-native-cli-*.tgz

ENTRYPOINT ["/bin/sh"]
