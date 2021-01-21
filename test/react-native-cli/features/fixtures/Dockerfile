FROM node:lts-alpine

RUN apk add git

RUN git config --global user.email "noone@example.com"
RUN git config --global user.name "No One"

COPY . /app

WORKDIR /app

RUN npm i -g bugsnag-react-native-cli-*.tgz

ENTRYPOINT ["/bin/sh"]
