ARG NODE_VERSION=12
FROM node:$NODE_VERSION-alpine

WORKDIR /app

COPY package* ./
RUN npm install

COPY . ./

RUN npm install --no-package-lock --no-save --legacy-peer-deps bugsnag-node*.tgz
RUN npm run build
