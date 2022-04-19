#!/bin/sh
curl https://install.meteor.com/ | sh
meteor build ./build --directory --server-only --allow-superuser