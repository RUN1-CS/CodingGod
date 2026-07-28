FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY *.js ./

RUN npm install

CMD ["npm", "run", "start"]