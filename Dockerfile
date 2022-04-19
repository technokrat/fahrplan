# syntax=docker/dockerfile:1

FROM node:latest AS builder
COPY . /
RUN /build.sh


FROM node:latest
COPY --from=builder /build ./
RUN (cd ./bundle/programs/server && npm install)
ENV PORT=80
EXPOSE 80
CMD node ./bundle/main.js
