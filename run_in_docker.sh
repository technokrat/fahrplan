#!/bin/bash

docker_path=`which docker`

if [[ -z $docker_path ]]
then
sudo apt-get -y update && sudo apt-get -y install docker.io docker-compose
fi

meteor_path=`which meteor`

if [[ -z $meteor_path ]]
then
curl https://install.meteor.com/ | sh
fi

rm -rf ./bundle
meteor build ./docker_image --directory --server-only
cp Dockerfile ./docker_image/
cd ./docker_image

docker build -t trambam .

cd ..
docker-compose up -d


