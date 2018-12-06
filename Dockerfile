FROM node:10

WORKDIR /usr/src/app

COPY . /usr/src/app/
RUN npm install
RUN npx lerna bootstrap
