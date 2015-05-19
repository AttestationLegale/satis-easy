#!/usr/bin/env bash

if [ -z "$npm_package_config_mongourl" ]; then echo "No mongo_url config found in package.json"; else export MONGO_URL=$npm_package_config_mongourl; fi
if [ -z "$1" ]; then echo "Meteor will use internal mongo"; else export MONGO_URL=$1; fi

meteor --settings settings.json
