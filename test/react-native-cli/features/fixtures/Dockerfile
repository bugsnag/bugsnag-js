FROM node:lts-alpine

RUN apk add git make gcc libc-dev ruby-dev ruby-bigdecimal ruby-etc
RUN gem install cocoapods

COPY . /app

WORKDIR /app

RUN npm i -g bugsnag-react-native-cli-*.tgz

ENTRYPOINT ["/bin/sh"]
