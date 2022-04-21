# syntax=docker/dockerfile:1

FROM node:latest AS builder
RUN curl https://install.meteor.com/ | sh
COPY . /app
WORKDIR /app
RUN meteor npm install
RUN meteor build ../build --directory --server-only --allow-superuser


FROM node:latest
COPY --from=builder /build ./
RUN (cd ./bundle/programs/server && npm install)
ENV PORT=80
EXPOSE 80
CMD node ./bundle/main.js
