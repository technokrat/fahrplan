#!/bin/bash

docker_path=`which docker`

if [[ -z $docker_path ]]
then
sudo apt-get -y update && sudo apt-get -y install docker.io docker-compose
fi

docker build -t fahrplan .
docker-compose up -d
