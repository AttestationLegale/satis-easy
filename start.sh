#!/usr/bin/env bash

if [ -z "$NPM_PACKAGE_CONFIG_MONGOURL" ]; then echo "No mongo_url config found in package.json"; else export MONGO_URL=$NPM_PACKAGE_CONFIG_MONGOURL; fi
if [ -z "$1" ]; then echo "Meteor will use internal mongo"; else export MONGO_URL=$1; fi

meteor --settings settings.json
