FROM node:alpine

ENV YARN_VERSION 1.19.1
WORKDIR /usr/src/app/

RUN yarn policies set-version $YARN_VERSION

COPY package*.json ./

RUN apk --update upgrade \
    && apk add --no-cache ca-certificates python make g++ libc6-compat \
    && yarn --production --ignore-engines

COPY . .

EXPOSE 9191

CMD [ "node", "index.js" ]
