# Run only with run_in_docker.sh

FROM node:latest
COPY . /bundle
RUN (cd /bundle/programs/server && npm install && npm install meteor-deque babel-runtime)
ENV PORT=80
EXPOSE 80
CMD node /bundle/main.js
