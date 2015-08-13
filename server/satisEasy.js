var fs = Npm.require('fs'),
    currentDir = fs.realpathSync('./'),
    tmpDir = currentDir + '/tmp~/',
    saveDir = Meteor.settings.saveDir;

if (!fs.existsSync(Meteor.settings.buildDir)) {
    throw new Error('error in buildDir');
}

if (!saveDir
    || !fs.existsSync(saveDir)) {
    fs.mkdirSync(tmpDir);
    saveDir = tmpDir;
    console.warn("saveDir " + Meteor.settings.saveDir + " in settings doesn't exists, application will use this path instead: " + saveDir);
}

Meteor.startup(function serverOnStartup() {
    // init build collection
    if (!BuildRunning.find().count()) {
        BuildRunning.insert({running: 0});
    }

    if (!BuildNeeded.find().count()) {
        BuildNeeded.insert({needed: 0});
    }

    (function initDb() {
        // create default satis file
        if (!fs.existsSync(Meteor.settings.satisJson)) {
            console.warn("your satis (" + Meteor.settings.satisJson + ") file doesn't exists, a sample one is going to be created.");
            fs.writeFileSync(Meteor.settings.satisJson, Assets.getText('satis.default.json'));
        }

        var buf = fs.readFileSync(Meteor.settings.satisJson),
            json = JSON.parse(buf.toString());

        if (!Informations.find().count()) {
            var dataInfo = {
                title: json.name ? json.name : Meteor.settings.public.informations.title,
                homepage: json.homepage ? json.homepage : Meteor.settings.public.informations.homepage,
                description: json.description ? json.description : Meteor.settings.public.informations.description
            };

            if (json.config
                && json.config['github-oauth']) {
                // @TODO foreach on this node to insert it in Informations
                var keys = _.keys(json.config['github-oauth']),
                    config = [];
                _.each(keys, function initConfigWithJsonContent(key) {
                    config.push({
                        name: key,
                        token: json.config['github-oauth'][key]
                    });
                });

                dataInfo.config = {};
                dataInfo.config['github-oauth'] = config;
            }

            if (json.archive) {
                var keys = _.keys(json.archive),
                    archive = [];
                _.each(keys, function initArchiveWithJsonContent(key) {
                    archive.push({
                        name: key,
                        token: json.archive[key]
                    });
                });

                dataInfo.archive = archive;
            }

            Informations.insert(dataInfo);

            console.log('Informations section provisionned title/homepage/description/config.github-oauth/archive datas');
        }

        if (json.repositories
            && !Repositories.find().count()) {
            _.each(json.repositories, function initRepositoriesWithJsonContent(repo) {
                Repositories.insert(repo);
            });

            console.log('Repositories section provisionned with ' + _.size(json.repositories) + ' repo');
        }

        if (json.require
            && !Packages.find().count()) {
            var keys = _.keys(json.require);
            _.each(keys, function initPackagesWithJsonContent(key) {
                var dataPackage = {
                    name: key,
                    version: json.require[key]
                };
                Packages.insert(dataPackage);
            });

            console.log('Require section provisionned with ' + _.size(json.require) + ' packages');
        }
    })();

    // restore build running and launch a build
    var build = BuildRunning.findOne();
    if (build.running !== 0) {
        BuildRunning.update({
            _id: build._id
        }, {
            $set: {
                running: 0,
                endDate: new Date()
            }
        });

        Meteor.call('build');
    }
});

Meteor.methods({
    "generate": function methodsGenerate(build) {
        SSR.compileTemplate('satisJson', Assets.getText('satis.json'));

        var json = SSR.render('satisJson', {

            title: function ssrTitle() {
                var tt = Informations.findOne() ? Informations.findOne().title : Meteor.settings.public.informations.title;

                return tt;
            },

            description: function ssrDescription() {
                var ds = Informations.findOne() ? Informations.findOne().description : Meteor.settings.public.informations.description;

                return ds;
            },

            homepage: function ssrHomepage() {
                var hp = Informations.findOne() ? Informations.findOne().homepage : Meteor.settings.public.informations.homepage;

                return hp;
            },

            minimumStability: function ssrMinimumStability() {
              var ms = Informations.findOne() ? Information.findOne().minimumStability : Meteor.settings.public.information.minimumStability;

              return ms;
            },

            configGithubOauth: function ssrConfigGithubOauth() {
                /*
                 * create a fake collection with a new property: isNotLast that will allow to manage
                 * the last ","
                 */
                var config = new Meteor.Collection(null),
                    infos = Informations.findOne(),
                    total = infos && infos.config && _.has(infos.config, 'github-oauth') ? _.size(infos.config['github-oauth']) : 0,
                    counter = 0;

                if (total) {
                    var keys = _.keys(infos.config['github-oauth']);
                    _.each(keys, function ssrConfigEachOAuth(key) {
                        var item = infos.config['github-oauth'][key];
                        counter++;
                        _.extend(item, {isNotLast: (counter < total)});
                        config.insert(item);
                    });
                }

                return config.find();
            },

            repositories: function ssrRepositories() {
                /*
                 * create a fake collection with a new property: isNotLast that will allow to manage
                 * the last ","
                 */
                var repos = new Meteor.Collection(null),
                    total = Repositories.find({}).count(),
                    counter = 0;

                Repositories.find({}, {sort: {url: 1}}).forEach(function ssrEachRepositories(item) {
                    counter++;
                    _.extend(item, {isNotLast: (counter < total)});
                    repos.insert(item);
                });

                return repos.find();
            },

            packages: function ssrPackages() {
                /*
                 * create a fake collection with a new property: isNotLast that will allow to manage
                 * the last ","
                 */
                var packages = new Meteor.Collection(null),
                    total = Packages.find({}).count(),
                    counter = 0;

                Packages.find({}, {sort: {name: 1}}).forEach(function ssrEachPackages(item) {
                    counter++;
                    _.extend(item, {isNotLast: (counter < total)});
                    packages.insert(item);
                });

                return packages.find();
            },

            hasPackages: function ssrHasPackages() {
                return Packages.find().count();
            },

            archive: function ssrArchive() {
                var hp = Informations.findOne(),
                    archive = hp && hp.archive ? hp.archive : null;

                _.extend(archive, {
                    skipDev: (archive.skipDev ? "true" : "false"),
                    requireDeps: (archive.requireDeps ? "true" : "false"),
                    requireDevDeps: (archive.requireDevDeps ? "true" : "false")
                });

                return archive;
            },

            hasArchive: function ssrHasArchive() {
                return !!this.archive();
            }
        });

        fs.writeFileSync(saveDir + '/satis.json', json);

        // launch build only if no job running
        var job = BuildRunning.findOne();
        if (job && job.running === 0 && build) {
            Meteor.call('build');
        }
    },

    "build": function methodsBuild(retries) {
        var modifiers = {},
            buildRunning = BuildRunning.findOne({}, {_id: true}),
            buildNeeded = BuildNeeded.findOne({}, {_id: true}),
            phpCmd = 'php ' + Meteor.settings.satisBinary + ' build ' + saveDir + '/satis.json' + ' ' + Meteor.settings.buildDir + ' --skip-errors',
            // phpCmd = 'php ' + Meteor.settings.satisBinary + ' build ' + Meteor.settings.satisJson + ' ' + Meteor.settings.buildDir,
            childProcess = Npm.require('child_process'),
            exec = Meteor.wrapAsync(childProcess.exec);

        // launch buildRunning only if no job running, ask to retry
        var job = BuildRunning.findOne();
        if (job.running !== 0) {
            var retry = new Retry({
                baseTimeout: 1000, //starting from 100ms and starting
                maxTimeout: 1000 //max timeout will be 1 sec
            }),
                retries = retries && _.isNumber(retries) ? retries : 0,
                buildAgain = function buildAgain() {
                    retries++;
                    Meteor.call('buildRunning', retries, function methodBuildAgain(err, res) {
                        if (!err) {
                            console.info('Build succeed');
                            return;
                        }

                        if (err.code == 501) {
                            console.error('Build error, no retry');
                            return;
                        }

                        if(retries < 100) {
                            console.log('retrying because %s', err.message);
                            retry.retryLater(retries, buildAgain);
                        } else {
                            console.log('failed after maximum retries: ', retries);
                        }
                    });
                };

            if (!retries || !_.isNumber(retries)) {
                buildAgain();
            }

            throw new Meteor.Error("A job is already running", 501);
        }

        BuildRunning.update({
            _id: buildRunning._id
        }, {
            $set: {
                running: 1,
                startDate: new Date()
            }
        });

        try {
            console.log(phpCmd);
            var res = exec(phpCmd);

            BuildNeeded.update({
                _id: buildNeeded._id
            }, {
                needed: 0,
                endDate: new Date()
            });
        } catch (e) {
            console.error('exec failed (cmd: %s)', phpCmd);
            console.warn('oups start');
            console.error(e);
            console.warn('oups end');

            var error = e;
        }

        var setData = {
            running: 0,
            endDate: new Date()
        },
            unsetData = {};

        if (error) {
            _.extend(setData, {error: error});
        } else {
            _.extend(modifiers, {$unset: {error: ""}});
        }

        _.extend(modifiers, {$set: setData});

        BuildRunning.update({
            _id: buildRunning._id
        }, modifiers);

        // @TODO check res to alert user if everything is ok or if an error happened
    }
});
