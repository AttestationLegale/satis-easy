# Satis generator

A simple satis.json file generator to help you to manage your private repositories (only type composer supported actually, do some pull request to improve that feature).

## Installation

* Like any meteorJs application
* Copy the package.dist.json to package.json
* Copy the settings.dist.json to settings.json
* Follow next section "Configuration" 
* chmod 755 start.sh
* run the app with "npm start", or directly with ./start.sh or start.bat (if you don't set config in package.json)

## Configuration

Your PHP binary must be accessible to the user that will execute the meteor binary.

If you don't want to use the embeded MongoDb provided by Meteor, you can set a mongo_url in the package.json file :
* config/mongo_url

In the settings.json file you have some configuration to customize:

* satisJsonPath: the path to your satis.json file on your server, used only the first start of the app to get common infos, repositories and packages
* buildDir: the path to the folder where you want satis generate its html files
* saveDir: the folder where the new json file will be saved (satis.json) so that it won't remove your original satis.json
* public/informations/*: title and homepage of your Satis repository
* config/colPrefix: the prefix name of your mongodb collection 

## Todo

* Manage this : 
 
``` 
   "config": {
     "github-oauth": {
       "github.com": ""
     }
   }
```
        
* Do check on input fields : check url, check packages : version constraints and naming, ...
* Do automated test
* Add Realtime ergonomy by displaying what has changed/removed/inserted to all connected user (less priority coz that app will not be heavily used)

* Don't remove repository, but create a status field which will allow to get back a repo removed by error.

* Manage Archive section
* Manage Other kind of repositories than only "composer" type
* When build failed, display message to all users (store last error only ?)
* Fix the button ForceBuild on top using pushpin of Materialize
 
* Maybe don't use anymore satis to build, but generate the html directly with this tool, we already have required data.
