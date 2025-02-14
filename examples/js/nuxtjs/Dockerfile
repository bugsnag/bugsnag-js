FROM node:10@sha256:59531d2835edd5161c8f9512f9e095b1836f7a1fcb0ab73e005ec46047384911

WORKDIR /usr/src/app

COPY package* /usr/src/app/
RUN npm install

COPY . /usr/src/app/
RUN npm run build
ENV HOST 0.0.0.0
CMD npm start
