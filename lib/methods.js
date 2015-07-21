Meteor.methods({
    'removeError': function () {
        var build = BuildRunning.findOne();

        if (!build) {
            return;
        }

        if (this.isSimulation) {
            $("#toast-container .toast i").parent().hide();
        }

        BuildRunning.update({_id: build._id}, {$unset: {error: true}});

        console.log(BuildRunning.findOne());
    }
});