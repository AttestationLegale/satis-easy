var helperIsActive = function helperIsActive() {
    var className = '';

    if (arguments[0]) {
        className =  'active ';
    }

    return className;
};
UI.registerHelper('isActive', helperIsActive);

// inform that it needs to re-generate file and ask satis to build
var upBuildNeeded = function buildNeeded() {
    var buildNeeded = BuildNeeded.findOne();

    BuildNeeded.update({
        _id: buildNeeded._id
    }, {
        needed: 1
    });
};

Template.menu.onRendered(function tplMenuOnRendered() {
    $(document).ready(function tplMenuDocumentReady(){
        $('.navbar-fixed').pushpin({ top: $('.navbar-fixed').offset().top });
    });
});

Template.action.onRendered(function tplActionOnCreated() {
    $(document).ready(function(){
        $('#buildSatis').pushpin({ offset: ($('.navbar-fixed').offset().top + 85) });
    });
});

Meteor.startup(function() {
    Tracker.autorun(function() {
        var buildRunning = BuildRunning.findOne();

        if (buildRunning
            && buildRunning.error) {
            // the toast is not a member of action template, so i don't know for instance how to bind an event from action template to the toast, so i use meteor methods which is not my prefered wish
            Materialize.toast("An error happened on server, ask your admin to look at the logs or in the BuildRunning collections "
                + ' <i onclick="javascript:Meteor.call(\'removeError\');" class="mdi-action-delete" style="cursor:pointer"></i>', 100000);
            console.warn(buildRunning.error.stack);
        }
    });
});

Template.action.helpers({
    'isRunning': function tplMenuIsRunning() {
        var disabled = "disabled",
            build = BuildRunning.findOne();

        if (!build
            || (build
            && build.running === 0)) {
            disabled = " waves-effect waves-light red accent-3 ";
        }

        return disabled;
    },

    'isNeeded': function tplMenuIsNeeded() {
        var buildNeeded = BuildNeeded.findOne();

        if (buildNeeded
            && buildNeeded.needed) {
            return true;
        }

        return false;
    }
});

Template.action.events({
    'click #buildSatis:not(".disabled")': function tplMenuClickBuild(ev, tpl) {
        ev.preventDefault();

        // manage disabled class from materialize
        if ($(ev.currentTarget).hasClass('disabled')) {
            return;
        }

        // ask for generate json and build satis
        Meteor.call('generate', 1);
    }
});

Template.menu.events({
    'click li a[href="#"][data-dest]': function tplMenuClickMenu(ev, tpl) {
        ev.preventDefault();

        Router.go(ev.currentTarget.attributes['data-dest'].value);
        _.each(tpl.findAll('li'), function tplMenuRouterRemoveClass(item) {
           $(item).removeClass('active');
        });
        $(ev.currentTarget).parent().addClass('active');
    },

    'click #gotoSatis-btn': function tplMenuClickGoToSatis(ev, tpl) {
        ev.preventDefault();

        var infos = Informations.findOne();
        if (!infos.homepage) {
            Materialize.toast("No homepage filled in settings. Fill it to activate this button", 4000);
            return;
        }

        location.href = infos.homepage;
    }
});

Template.menu.helpers({
    "getLastBuildDate": function tplMenuGetLastBuildDate() {
        var build = BuildRunning.findOne();

        return build && build.endDate ? build.endDate.toLocaleString() : '...';
    }
});

Template.infos.events({
    'blur #title-input': function tplInfosBlurFieldTitle(ev, tpl) {
        var data = ev.currentTarget.value;
        if (this.title === data) return;
        if (!data.length) {
            Materialize.toast("You must fill Title field", 5000);
            return;
        }

        Informations.update({_id: this._id}, {$set: {title: ev.currentTarget.value}});

        Meteor.call('generate');
    },

    'blur #description-input': function tplInfosBlurFieldDescription(ev, tpl) {
        var data = ev.currentTarget.value;
        if (this.description === data) return;
        if (!data.length) {
            Materialize.toast("You must fill Description field", 5000);
            return;
        }

        Informations.update({_id: this._id}, {$set: {description: ev.currentTarget.value}});

        Meteor.call('generate');
    },

    'blur #homepage-input': function tplInfosBlurFieldHomepage(ev, tpl) {
        var data = ev.currentTarget.value;
        if (this.homepage === data) return;
        if (!data.length) {
            Materialize.toast("You must fill Homepage field", 5000);
            return;
        }

        Informations.update({_id: this._id}, {$set: {homepage: ev.currentTarget.value}});

        Meteor.call('generate');
    }
});

Template.infos.helpers({
    infos: function tplInfosInfos() {
        var infos = Informations.findOne();

        return infos;
    }
});

Template.archive.helpers({
    archive: function tplArchiveArchive() {
        var infos = Informations.findOne(),
            basicInfos = infos ? {_id: infos._id} : {},
            toReturn = infos && infos.archive ? _.extend(basicInfos, infos.archive) : basicInfos;

        return toReturn;
    },

    isActive: function tplArchiveIsActive() {
        if (arguments[0]) {
            return 'active ';
        }
    },

    isCheckedArchiveSkipDev: function tplArchiveIsChecked() {
        var infos = Informations.findOne();

        if (!infos || ! infos.archive) return;

        if (infos.archive.skipDev) return 'checked';
    },

    isCheckedRequireDeps: function tplArchiveIsChecked() {
        var infos = Informations.findOne();

        if (!infos || ! infos.archive) return;

        if (infos.archive.requireDeps) return 'checked';
    },

    isCheckedRequireDevDeps: function tplArchiveIsChecked() {
        var infos = Informations.findOne();

        if (!infos || ! infos.archive) return;

        if (infos.archive.requireDevDeps) return 'checked';
    }
});

Template.archive.events({
    'blur input[type=text], change input[type=checkbox]': function tplArchiveBlur(ev, tpl) {
        var data = {
            directory: tpl.find('input#archive-directory-input').value,
            format: tpl.find('input#archive-format-input').value,
            prefixUrl: tpl.find('input#archive-prefixurl-input').value,
            skipDev: tpl.find('input#archive-skipdev-input').checked ? true : false,
            requireDeps: tpl.find('input#archive-requiredeps-input').checked ? true : false,
            requireDevDeps: tpl.find('input#archive-requiredevdeps-input').checked ? true : false
        };

        // checks
        if (!_.contains(['tar', 'zip'], data.format)) {
            Materialize.toast("Format must be tar or zip, you filled " + data.format, 5000);
            delete data.format;
        }

        // a new build is needed ?
        var currentArchive = Informations.findOne();
        if (!currentArchive
            || !currentArchive.archive) {
            upBuildNeeded();
        } else {
            var newKeys = _.keys(data),
                curKeys = _.keys(currentArchive.archive);

            _.each(newKeys, function(key) {
                if (!_.has(currentArchive.archive, key)) {
                    upBuildNeeded();
                    return;
                }

                if (data[key] !== currentArchive.archive[key]) {
                    upBuildNeeded();
                    return;
                }
            });
        }

        // save
        Informations.update({_id: this._id}, {$set: {archive: data}});

        Meteor.call('generate');
    },

    'click button[name="resetRepo"]': function tplRepositoriesClickResetRepo(ev, tpl) {
        _.each(tpl.findAll('input.addRepo'), function tplRepositoriesResatRepoEach(item) {
            item.value = '';
        });
        tpl.find('.select-dropdown').value = 'vcs';
    }
});

Template.repositories.onRendered(function() {
    $('select').material_select();
});

Template.repositories.helpers({
    repositories: function tplRepositoriesRepositories() {
        return Repositories.find({}, {sort: {url: 1}});
    }
});

Template.repositories.events({
    'click button[name="addRepo"]': function tplRepositoriesClickAddRepo(ev, tpl) {
        var data = {
            type: tpl.find('#addRepo .select-dropdown').value,
            url: tpl.find('input#addRepo-url-input').value
        };

        if (!data.type.length
            || !data.url.length) {
            Materialize.toast("You must select a Type and fill Url field", 5000);
            return;
        }

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
        tpl.find('.select-dropdown').value = 'vcs';
    }
});

Template.repositories_row.onRendered(function() {
    $('select').material_select();
});

Template.repositories_row.helpers({
    "isSelected": function tplRepositoriesRowIsSelected(type) {
        var selected = "";

        if (type === this.type) {
            selected = "selected";
        }

        return selected;
    }
});

Template.repositories_row.events({
    'blur input.editRepo, change select.editRepo, click button[name="editRepo"]': function tplRowRepositoriesClickEditRepo(ev, tpl) {
        var field = tpl.find('input#editRepo-url-' + this._id + '-input'),
            data = {
            type: tpl.find('#edit-' + this._id + ' .select-dropdown').value, // field generated by materialize... don't know how to deal with correctly to be able to use field var instead of #edit-_id ....
            url: field.value
            };

        // do nothing, if nothing change ;-)
        if (data.type === this.type
            && data.url === this.url) {
            return;
        }

        // check
        if (!data.type.length
            || !data.url.length) {
            Materialize.toast("You must select a Type and fill Url field", 5000);
            return;
        }

        // save
        Repositories.update({_id: this._id}, {$set: data});

        // generate file and ask satis to build
        upBuildNeeded();
    },

    'click button[name="removeRepo"]': function tplRowRepositoriesClickRemoveRepo(ev, tpl) {
        Repositories.remove({_id: this._id});

        // don't generate file on remove. User must force build with required button. It's to prevent remove per error
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

        if (!data.version.length
            || !data.name.length) {
            Materialize.toast("You must fill Name and Version fields", 5000);
            return;
        }

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
    'blur input.editPackage': function tplRowPackagesClickEditPackage(ev, tpl) {
        var data = {
            version: tpl.find('input#editPackage-version-' + this._id + '-input').value,
            name: tpl.find('input#editPackage-name-' + this._id + '-input').value
        },
            buildNeeded = BuildNeeded.findOne();

        // do nothing, if nothing change ;-)
        if (data.version === this.version
            && data.name === this.name) {
            return;
        }

        // check
        if (!data.version.length
            || !data.name.length) {
            Materialize.toast("You must fill Name and Version fields", 5000);
            return;
        }

        // save
        Packages.update({_id: this._id}, {$set: data});

        upBuildNeeded();
    },

    'click button[name="removePackage"]': function tplPackagesClickRemovePackage(ev, tpl) {
        Packages.remove({_id: this._id});

        // don't generate file on remove. User must force build with required button. It's to prevent remove per error
    }
});

