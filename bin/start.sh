#!/usr/bin/env bash

echo "*** start configuration ***"

if [ -z "$npm_package_config_port" ];
then
    echo "No port config found in package.json, Meteor will run on 3000";
else
    echo "Port settled to $npm_package_config_port"
    export PORT=$npm_package_config_port;
fi
if [ -z "$npm_package_config_rooturl" ];
then
    echo "No root_url config found in package.json";
else
    echo "ROOT_URL settled to $npm_package_config_rooturl"
    export ROOT_URL=$npm_package_config_rooturl;
fi
if [ -z "$npm_package_config_mongourl" ];
then
    echo "No mongo_url config found in package.json, Meteor will use internal mongo";
else
    echo "MONGO_URL settled to $npm_package_config_mongourl"
    export MONGO_URL=$npm_package_config_mongourl;
fi
if [ -z "$npm_package_config_mailurl" ];
then
    echo "No mail_url config found in package.json";
else
    echo "MAIL_URL settled to $npm_package_config_mailurl"
    export MAIL_URL=$npm_package_config_mailurl;
fi

echo "*** end configuration ***"

# start with specified
if [ -z "$npm_package_config_settingsfile" ] || [ -f $npm_package_config_settingsfile ];
then
    echo "Start meteor without settings" && meteor;
else
    echo "Start meteor with settings file $npm_package_config_settingsfile"
    meteor --settings $npm_package_config_settingsfile;
fi
