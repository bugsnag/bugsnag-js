FROM node:8

WORKDIR /usr/src/app

COPY package* /usr/src/app/
RUN npm install

COPY . /usr/src/app/
CMD npm start
