FROM node:8

WORKDIR /usr/src/app

COPY package* /usr/src/app/
RUN npm install

COPY . /usr/src/app/
RUN npm run build
CMD npm start
