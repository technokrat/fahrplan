#!/bin/sh

sudo apt-get -y update && sudo apt-get -y install docker.io
sudo docker build --rm -t trambam .
sudo docker run -p 8080 --restart unless-stopped --rm -i -t trambam
