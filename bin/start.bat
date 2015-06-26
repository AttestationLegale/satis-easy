@ECHO off

ECHO "*** start configuration ***"

IF [%NPM_PACKAGE_CONFIG_PORT%] NEQ [] (
    ECHO "Port settled to %NPM_PACKAGE_CONFIG_PORT%"
    SET MONGO_URL=%NPM_PACKAGE_CONFIG_PORT%
) ELSE (
    ECHO "No port config found in package.json, Meteor will run on 3000"
)
IF [%NPM_PACKAGE_CONFIG_ROOTURL%] NEQ [] (
    ECHO "ROOT_URL settled to %NPM_PACKAGE_CONFIG_ROOTURL%"
    SET MONGO_URL=%NPM_PACKAGE_CONFIG_ROOTURL%
) ELSE (
    ECHO "No root_url config found in package.json"
)
IF [%NPM_PACKAGE_CONFIG_MONGOURL%] NEQ [] (
    ECHO "MONGO_URL settled to %NPM_PACKAGE_CONFIG_MONGOURL%"
    SET MONGO_URL=%NPM_PACKAGE_CONFIG_MONGOURL%
) ELSE (
    ECHO "No mongo_url config found in package.json, Meteor will use internal mongo"
)
IF [%NPM_PACKAGE_CONFIG_MAILURL%] NEQ [] (
    ECHO "MAIL_URL settled to %NPM_PACKAGE_CONFIG_MAILURL%"
    SET MAIL_URL=%NPM_PACKAGE_CONFIG_MAILURL%
) ELSE (
    ECHO "No mail_url config found in package.json"
)

ECHO "*** end configuration ***"

IF EXIST %NPM_PACKAGE_CONFIG_SETTINGSFILE% CMD /c "ECHO "Start meteor with settings file %NPM_PACKAGE_CONFIG_SETTINGSFILE%""
IF EXIST %NPM_PACKAGE_CONFIG_SETTINGSFILE% CMD /c "meteor --settings %NPM_PACKAGE_CONFIG_SETTINGSFILE%"

IF NOT EXIST %NPM_PACKAGE_CONFIG_SETTINGSFILE% CMD /c "ECHO "Start meteor without settings""
IF NOT EXIST %NPM_PACKAGE_CONFIG_SETTINGSFILE% CMD /c "meteor"
