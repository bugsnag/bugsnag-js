FROM node:lts-alpine

RUN apk add git

COPY . /app

WORKDIR /app

RUN npm i -g bugsnag-react-native-cli-*.tgz

# TODO(PLAT-5515) 'pod install' is currently always run but will only work on
# macOS, so we stub it out with a script that does nothing
RUN printf '#!/usr/bin/env sh\nprintf "this is a stub of $0\n"' > /usr/bin/pod && chmod +x /usr/bin/pod

ENTRYPOINT ["/bin/sh"]
