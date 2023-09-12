ARG NODE_VERSION=12
FROM node:$NODE_VERSION-alpine

WORKDIR /app

COPY package* ./
RUN npm install

COPY . ./

RUN npm install --no-package-lock --no-save bugsnag-node*.tgz bugsnag-plugin-restify*.tgz

ENV NODE_ENV production
CMD node scenarios/app
