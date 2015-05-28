// @todo externalize this in a checkSettings function
if (!Meteor.settings.public) {
    throw new Error("You forgot to start meteor with a setting file !");
}

Informations = new Meteor.Collection(Meteor.settings.public.config.colPrefix + '-satis-informations');
Repositories = new Meteor.Collection(Meteor.settings.public.config.colPrefix + '-satis-repositories');
Packages     = new Meteor.Collection(Meteor.settings.public.config.colPrefix + '-satis-packages');
BuildRunning = new Meteor.Collection(Meteor.settings.public.config.colPrefix + '-satis-build-running');
BuildNeeded  = new Meteor.Collection(Meteor.settings.public.config.colPrefix + '-satis-build-needed');
