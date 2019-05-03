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

rm -rf ./tmp
mkdir ./tmp
meteor build ./tmp --directory --server-only --allow-superuser
cp Dockerfile ./tmp/
cd ./tmp

docker build -t trambam .

cd ..
rm -r ./tmp

docker-compose up -d


