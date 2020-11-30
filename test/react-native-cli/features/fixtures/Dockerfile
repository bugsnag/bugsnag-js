FROM node:lts-alpine

RUN apk add git bash make gcc libc-dev ruby-dev ruby-bigdecimal ruby-etc
RUN gem install cocoapods

COPY . /app

WORKDIR /app

RUN npm i -g bugsnag-react-native-cli-*.tgz

ENV COCOAPODS_ALLOW_ROOT=1

ENTRYPOINT ["/bin/sh"]
