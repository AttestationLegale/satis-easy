var goToHome = goToRepositories = function () {
        this.render('repositories');
    },

    goToPackages = function () {
        this.render('packages');
    },

    goToSettings = function() {
        this.render('settings');
    },

    routes = [
        {"url": "/settings", "label": "Settings", "controller": goToSettings},
        {"url": "/repositories", "label": "Repositories", "controller": goToRepositories},
        {"url": "/packages", "label": "Packages", "controller": goToPackages}
    ];

NavBars = new Meteor.Collection(null);

Router.configure({
    layoutTemplate: 'ApplicationLayout'
});

Router.route("", goToHome);
_.each(routes, function(item) {
    NavBars.insert(item);
    Router.route(item.url, item.controller);
});
