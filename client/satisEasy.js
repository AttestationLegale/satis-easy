var helperIsActive = function helperIsActive() {
    var className = '';

    if (arguments[0]) {
        className =  'active ';
    }

    return className;
};
UI.registerHelper('isActive', helperIsActive);

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
    'click button[name="editRepo"]': function tplRowRepositoriesClickEditRepo(ev, tpl) {
        var field = tpl.find('input#editRepo-url-' + this._id + '-input'),
            data = {
            type: tpl.find('#edit-' + this._id + ' .select-dropdown').value, // field generated by materialize... don't know how to deal with correctly to be able to use field var instead of #edit-_id ....
            url: field.value
        };

        // save
        Repositories.update({_id: this._id}, {$set: data});

        // generate file and ask satis to build
        Meteor.call('generate');
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
            version: tpl.find('input#editPackage-name-' + this._id + '-input').value,
            name: tpl.find('input#editPackage-version-' + this._id + '-input').value
        };

        // save
        Packages.update({_id: this._id}, {$set: data});

        // generate file and ask satis to build
        Meteor.call('generate');
    },

    'click button[name="removePackage"]': function tplPackagesClickRemovePackage(ev, tpl) {
        Packages.remove({_id: this._id});

        // don't generate file on remove. User must force build with required button. It's to prevent remove per error
    }
});
