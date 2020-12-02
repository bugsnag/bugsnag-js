FROM node:lts-alpine

RUN apk add git

RUN git config --global user.email "noone@example.com"
RUN git config --global user.name "No One"

COPY . /app

# TODO(PLAT-5515) 'pod install' is currently always run but will only work on
# macOS, so we stub it out with a script that does nothing
RUN printf '#!/usr/bin/env sh\nprintf "this is a stub of $0\n"' > /usr/bin/pod && chmod +x /usr/bin/pod

WORKDIR /app

# Artifcatory authentication
ARG REGISTRY_URL
ARG REG_BASIC_CREDENTIAL
ARG REG_NPM_EMAIL
RUN npm config set registry $REGISTRY_URL
RUN npm config set _auth $REG_BASIC_CREDENTIAL
RUN npm config set email $REG_NPM_EMAIL
RUN npm config set always-auth = true

# Files needs for installing the CLI
WORKDIR /test
COPY .git .git
COPY lerna.json .
COPY scripts/common.js scripts/react-native-cli-helper.js scripts/

# Install the CLI
ARG NOTIFIER_VERSION
ENV NOTIFIER_VERSION=$NOTIFIER_VERSION
RUN node -e "require('../test/scripts/react-native-cli-helper').installCli()"

ARG REACT_NATIVE_VERSION
COPY test/react-native-cli/features/fixtures/$REACT_NATIVE_VERSION /app

WORKDIR /app
ENTRYPOINT ["/bin/sh"]
