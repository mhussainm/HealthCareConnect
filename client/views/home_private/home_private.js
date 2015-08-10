Template.HomePrivate.rendered = function() {
	
			
};

Template.HomePrivate.events({
    'click #hc-facebook-login': function(event) {
    	event.preventDefault();
        Meteor.loginWithFacebook({
        	requestPermissions: ['email', 'user_about_me', 'user_events', 'user_hometown', 
        		'user_location', 'user_photos', 'user_posts', 'user_status']
        }, function(err){
            if (err) {
                throw new Meteor.Error("Facebook login failed");
            }
        });
    },
    
    'click #hc-facebook-logout': function(event) {
    	event.preventDefault();
        Meteor.logout(function(err){
            if (err) {
                throw new Meteor.Error("Logout failed");
            }
        })
    }
});;

Template.HomePrivate.helpers({
	'getRecords' : function() {
		return Session.get("currentHcUser");
	},
    'fbProfilePicHelper': function() {
    	if(Meteor.user() && Meteor.user().profile) {
			return 'http://graph.facebook.com/' + Meteor.user().profile.facebookId 
							+ '/picture?type=normal';
        }
        return '/img/whoareu.jpg?rls=201509092316';
    }	
});
