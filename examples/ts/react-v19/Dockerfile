FROM node:25-alpine3.21

WORKDIR /app

COPY package*.json .

RUN npm install 

COPY . . 

CMD ["npm", "start"]