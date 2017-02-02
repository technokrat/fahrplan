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
meteor build --directory .
cp Dockerfile ./bundle
cd ./bundle

docker build -t trambam .

cd ..
docker-compose up
#docker run --restart unless-stopped -p 80:80 -e ROOT_URL=http://trambam.chatz.li trambam


