#https://hub.docker.com/_/node?tab=tags&page=1
FROM node:16.18.1-alpine3.16

WORKDIR /usr/src/app

RUN apk add --update alpine-sdk
RUN apk add git python3

COPY package.json ./
COPY yarn.lock ./
COPY patches ./patches

RUN yarn

# When building docker images, docker caches the steps, so it's better to put the lines that would have lots of changes
# last, then when changing these steps the previous steps would use cache and move forward fast

COPY src ./src
COPY abi ./abi
COPY data ./data
COPY types ./types
COPY config ./config
COPY index.ts ./
COPY tsconfig.json ./


RUN yarn build
