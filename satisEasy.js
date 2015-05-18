// @todo externalize this in a checkSettings function
if (!Meteor.settings.public) {
    throw new Error("You forgot to start meteor with a setting file !");
}

Informations = new Meteor.Collection(Meteor.settings.public.config.colPrefix + '-satis-informations');
Repositories = new Meteor.Collection(Meteor.settings.public.config.colPrefix + '-satis-repositories');
Packages     = new Meteor.Collection(Meteor.settings.public.config.colPrefix + '-satis-packages');
BuildRunning = new Meteor.Collection(Meteor.settings.public.config.colPrefix + '-satis-build-running');

if (Meteor.isClient) {
    Template.menu.onRendered(function tplMenuOnRendered() {
        $(document).ready(function tplMenuDocumentReady(){
            $('.navbar-fixed').pushpin({ top: $('.navbar-fixed').offset().top });
        });
    });

    Template.action.helpers({
        'isRunning': function tplMenuIsRunning() {
            var disabled = "disabled",
                build = BuildRunning.findOne();

            if (build
                && build.running === 0) {
                disabled = " waves-effect waves-light red accent-3 ";
            }

            return disabled;
        }
    });

    Template.action.events({
        'click #buildSatis:not(".disabled")': function tplMenuClickBuild(ev, tpl) {
            ev.preventDefault();

            // manage disabled class from materialize
            if ($(ev.currentTarget).hasClass('disabled')) {
                return;
            }

            Meteor.call('build');
        }
    });

    Template.menu.events({
        'click li a[href="#"]': function tplMenuClickMenu(ev, tpl) {
            ev.preventDefault();

            Router.go(ev.currentTarget.attributes['data-dest'].value);
            _.each(tpl.findAll('li'), function tplMenuRouterRemoveClass(item) {
               $(item).removeClass('active');
            });
            $(ev.currentTarget).parent().addClass('active');
        }
    });

    Template.infos.events({
        'blur #title-input': function tplInfosBlurFieldTitle(ev, tpl) {
            var infos = Informations.findOne();
            if (infos.title !== ev.currentTarget.value) {
                Informations.update({_id: infos._id}, {$set: {title: ev.currentTarget.value}});

                Meteor.call('generate');
            }
        },

        'blur #description-input': function tplInfosBlurFieldDescription(ev, tpl) {
            var infos = Informations.findOne();
            if (infos.description !== ev.currentTarget.value) {
                Informations.update({_id: infos._id}, {$set: {description: ev.currentTarget.value}});

                Meteor.call('generate');
            }
        },

        'blur #homepage-input': function tplInfosBlurFieldHomepage(ev, tpl) {
            var infos = Informations.findOne();
            if (infos.homepage !== ev.currentTarget.value) {
                Informations.update({_id: infos._id}, {$set: {homepage: ev.currentTarget.value}});

                Meteor.call('generate');
            }
        }
    });

    Template.infos.helpers({
        title: function tplInfosTitle() {
            var infos = Informations.findOne();

            return infos ? infos.title : null;
        },

        description: function tplInfosDescription() {
            var infos = Informations.findOne();

            return infos ? infos.description : null;
        },

        homepage: function tplInfosHomepage() {
            var infos = Informations.findOne();

            return infos ? infos.homepage : null;
        },

        isActive: function tplInfosIsActive() {
            if (arguments[0]) {
                return 'active ';
            }
        }
    });

    Template.archive.helpers({
        archive: function tplArchiveArchive() {
            var infos = Informations.findOne();

            return infos ? infos.archive : null;
        },

        isActive: function tplArchiveIsActive() {
            if (arguments[0]) {
                return 'active ';
            }
        }
    });

    Template.repositories.helpers({
        repositories: function tplRepositoriesRepositories() {
            return Repositories.find({}, {sort: {url: 1}});
        }
    });

    Template.repositories.events({
        'click button[name="addRepo"]': function tplRepositoriesClickAddRepo(ev, tpl) {
            var data = {
                type: 'composer', // actually only composer supported
                url: tpl.find('input#addRepo-url-input').value
            };

            // save
            Repositories.insert(data);

            // reset
            tpl.find('button[name="resetRepo"]').click();

            // generate file and ask satis to build
            Meteor.call('generate');
        },

        'click button[name="resetRepo"]': function tplRepositoriesClickResetRepo(ev, tpl) {
            _.each(tpl.findAll('input.addRepo'), function tplRepositoriesResatRepoEach(item) {
                item.value = '';
            });
        }
    });

    Template.repositories_row.events({
        'click button.editRepo': function tplRowRepositoriesClickEditRepo(ev, tpl) {
            var field = tpl.find('input#editRepo-url-' + this._id + '-input'),
                data = {
                type: 'composer',
                url: field.value
            };

            // save
            Repositories.update({_id: this._id}, {$set: data});

            // generate file and ask satis to build
            Meteor.call('generate');
        },

        'click button[name="removeRepo"]': function tplRowRepositoriesClickRemoveRepo(ev, tpl) {
            Repositories.remove({_id: this._id});
        }
    });

    Template.packages.helpers({
        packages: function tplPackagesPackages() {
            return Packages.find({}, {sort: {name: 1}});
        }
    });

    Template.packages.events({
        'click button[name="addPackage"]': function tplPackagesClickAddPackage(ev, tpl) {
            var data = {
                    version: tpl.find('input#addPackage-version-input').value,
                    name: tpl.find('input#addPackage-name-input').value
                };

            // save
            Packages.insert(data);

            // reset
            tpl.find('button[name="resetPackage"]').click();

            // generate file and ask satis to build
            Meteor.call('generate');
        },

        'click button[name="resetPackage"]': function tplPackagesClickResetPackage(ev, tpl) {
            _.each(tpl.findAll('input.addPackage'), function tplPackagesClickAddPackageEach(item) {
                item.value = '';
            });
        }
    });

    Template.packages_row.events({
        'click button[name="editPackage"]': function tplRowPackagesClickEditPackage(ev, tpl) {
            var data = {
                version: tpl.find('input[name="url"].editPackage-' + this._id).value,
                name: tpl.find('input[name="url"].editPackage-' + this._id).value
            };

            // save
            Packages.update({_id: this._id}, {$set: data});

            // generate file and ask satis to build
            Meteor.call('generate');
        },

        'click button[name="removePackage"]': function tplPackagesClickRemovePackage(ev, tpl) {
            Packages.remove({_id: this._id});
        }
    });
}

if (Meteor.isServer) {
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
                    title: json.name,
                    homepage: json.homepage,
                    description: json.description
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

                Informations.insert(dataInfo);

                console.log('Informations section provisionned title/homepage/description/config.github-oauth datas');
            }

            if (!Repositories.find().count()
		&& json.repositories) {
                _.each(json.repositories, function initRepositoriesWithJsonContent(repo) {
                    Repositories.insert(repo);
                });

                console.log('Repositories section provisionned with ' + _.size(json.repositories) + ' repo');
            }

            if (!Packages.find().count()
		&& json.require) {
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
    });

    Meteor.methods({
        "generate": function methodsGenerate() {
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

                    Packages.find({}, {sort: {title: 1}}).forEach(function ssrEachPAckages(item) {
                        counter++;
                        _.extend(item, {isNotLast: (counter < total)});
                        packages.insert(item);
                    });

                    return packages.find();
                },

                hasPackages: function ssrHasPackages() {
                    return Packages.find().count();
                }
            });

            fs.writeFileSync(saveDir + '/satis.json', json);

            // @TODO : force write into Meteor.settings.satisJson ?

            Meteor.call('build');
        },

        "build": function methodsBuild() {
            var build = BuildRunning.findOne({}, {_id: true}),
                phpCmd = 'php ' + Meteor.settings.satisBinary + ' build ' + saveDir + '/satis.json' + ' ' + Meteor.settings.buildDir,
                // phpCmd = 'php ' + Meteor.settings.satisBinary + ' build ' + Meteor.settings.satisJson + ' ' + Meteor.settings.buildDir,
                childProcess = Npm.require('child_process'),
                exec = Meteor.wrapAsync(childProcess.exec);

            BuildRunning.update({
                _id: build._id
            }, {
                $set: {
                    running: 1,
                    startDate: new Date()
                }
            });

            try {
                var res = exec(phpCmd);
            } catch (e) {
                console.error('exec failed');
            }

            BuildRunning.update({
                _id: build._id
            }, {
                $set: {
                    running: 0,
                    endDate: new Date()
                }
            });

            // @TODO check res to alert user if everything is ok or if an error happened
        }
    });
}
