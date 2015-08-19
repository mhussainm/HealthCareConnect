Template.HomePrivate.rendered = function() {
	if(Meteor.user()) {
		Meteor.call("getNotificationCount", function(err, res) {
			console.log("res"+res);
			Session.set("unreadMsgNotificationCount", res);
		});			
	}	
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
		Meteor.call("getLatestPost", function(err, res) {
    		console.info('latest post', res);    		
    	});   	
    },
    
    'click #send-notification': function(event) {
		Meteor.call("sendPushNotification", function(err, res) {
			
		});
    }, 
    
	'click #hc-facebook-messages': function(event) {
    	event.preventDefault();
    	Meteor.call("updateReadMessages", function(err, res) {    		
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
    },	
	'isAdmin':function() {	
		if(Meteor.user() && Meteor.user().profile && 
				Meteor.user().profile.facebookId==="144028039266512")
		{
			return true;
		}
		else{
			return false;
		}
	},
	'notificationCount': function(){
		if(Session.get("unreadMsgNotificationCount") == "0")
		{
			return "";
		}
		return Session.get("unreadMsgNotificationCount");
	}    
});
