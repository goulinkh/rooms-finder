FROM node:12

WORKDIR /usr/app
COPY . .

RUN yarn install --silent
