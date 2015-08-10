Template.HomePrivate.rendered = function() {
	
};

Meteor.subscribe("healthCareUser");

HcUsers = new Mongo.Collection("hcUsers");

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
    },
    
    'click #hc-facebook-fetchinfo': function(event) {
    	event.preventDefault();
    	Meteor.call("fbFetchInfo", function(err, res) {
    		console.info('fbInfo', res);
    	});
    },
    
    'click #hc-facebook-fetchposts': function(event) {
    	event.preventDefault();
    	Meteor.call("fbFetchPosts", function(err, res) {
    		console.info('fbPosts', res);    		
    	});    	
    }    
});;

Template.HomePrivate.helpers({
	'getRecords' : function() {
		console.info("HcUsers - Count", HcUsers.find().count());
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
