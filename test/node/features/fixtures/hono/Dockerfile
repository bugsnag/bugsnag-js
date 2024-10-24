ARG NODE_VERSION=18
FROM node:$NODE_VERSION-alpine

WORKDIR /app

COPY package* ./
RUN npm install

COPY . ./

RUN npm install --no-package-lock --no-save bugsnag-node*.tgz

ENV NODE_ENV production
CMD node scenarios/app
