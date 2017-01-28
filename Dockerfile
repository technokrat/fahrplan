FROM ubuntu:latest

RUN apt-get update && \
    apt-get -y upgrade && \
    apt-get -y install curl && \
    curl https://install.meteor.com/ | sh

RUN useradd -m user

EXPOSE 8080

WORKDIR /home/user/trambam/

ADD . ./

USER user

CMD ["/usr/local/bin/meteor", "run", "-p", "8080"]
