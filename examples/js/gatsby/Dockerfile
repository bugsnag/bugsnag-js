FROM node:18@sha256:f12d34408955b2081f82078e8f96c3299ca0f38d11e76086cb9b9b1b669977e4
ARG GATSBY_BUGSNAG_API_KEY

WORKDIR /usr/src/app

COPY package* /usr/src/app/
RUN npm install

COPY . /usr/src/app/
RUN npm run build

CMD npm run serve -- --host 0.0.0.0
