var verifyEmail = false;

Accounts.onCreateUser(function(options, user) {
    // We still want the default hook's 'profile' behavior.
    if (options.profile) {
        user.profile = options.profile;
        user.profile.memberSince = new Date();

        // Copy data from Facebook to user object
        user.profile.facebookId = user.services.facebook.id;
        user.profile.firstName = user.services.facebook.first_name;
        user.profile.email = user.services.facebook.email;
        user.profile.link = user.services.facebook.link;
    }
    return user;
});

Meteor.startup(function() {

	// read environment variables from Meteor.settings
	if(Meteor.settings && Meteor.settings.env && _.isObject(Meteor.settings.env)) {
		for(var variableName in Meteor.settings.env) {
			process.env[variableName] = Meteor.settings.env[variableName];
		}
	}
		
});

Meteor.methods({
	"validateHealthcareUser": function(hcUsername, pwd){

		// Get healthcareUsers Records from Mock API
		var res = Meteor.http.call(
			'GET', 
			'http://demo5522401.mockable.io/NewHealthcareRecords'); 

		if (res && res.statusCode == 200) {
			//return JSON.parse(res.content).HealthcareRecords[0];
			var hcRecords = JSON.parse(res.content).HealthcareRecords;
			if(hcRecords.length > 0) {
				for(i = 0; i < hcRecords.length; i++) {				
						if(hcUsername === hcRecords[i]._id 
								&& pwd === hcRecords[i].password) {
							return hcRecords[i];
					}
				}
			}
			else {
				console.log("Zero records in healthcareRecords from Mock API");
			} 
		}
		else {
			console.log("Failure to fetch healthcareRecords from Mock API");
		}
		return null;	
	},
	"createUserAccount": function(options) {
		if(!Users.isAdmin(Meteor.userId())) {
			throw new Meteor.Error(403, "Access denied.");
		}

		var userOptions = {};
		if(options.username) userOptions.username = options.username;
		if(options.email) userOptions.email = options.email;
		if(options.password) userOptions.password = options.password;
		if(options.profile) userOptions.profile = options.profile;
		if(options.profile && options.profile.email) userOptions.email = options.profile.email;

		Accounts.createUser(userOptions);
	},
	"updateUserAccount": function(userId, options) {
		// only admin or users own profile
		if(!(Users.isAdmin(Meteor.userId()) || userId == Meteor.userId())) {
			throw new Meteor.Error(403, "Access denied.");
		}

		// non-admin user can change only profile
		if(!Users.isAdmin(Meteor.userId())) {
			var keys = Object.keys(options);
			if(keys.length !== 1 || !options.profile) {
				throw new Meteor.Error(403, "Access denied.");
			}
		}

		var userOptions = {};
		if(options.username) userOptions.username = options.username;
		if(options.email) userOptions.email = options.email;
		if(options.password) userOptions.password = options.password;
		if(options.profile) userOptions.profile = options.profile;

		if(options.profile && options.profile.email) userOptions.email = options.profile.email;
		if(options.roles) userOptions.roles = options.roles;

		if(userOptions.email) {
			var email = userOptions.email;
			delete userOptions.email;
			userOptions.emails = [{ address: email }];
		}

		var password = "";
		if(userOptions.password) {
			password = userOptions.password;
			delete userOptions.password;
		}

		if(userOptions) {
			Users.update(userId, { $set: userOptions });
		}

		if(password) {
			Accounts.setPassword(userId, password);
		}
	},
	"sendMail": function(options) {
		this.unblock();

		Email.send(options);
	}
});

/*
Accounts.onCreateUser(function (options, user) {
	user.roles = [];

	if(options.profile) {
		user.profile = options.profile;
	}
	
	return user;
});
*/

Accounts.validateLoginAttempt(function(info) {

	// reject users with role "blocked"
	if(info.user && Users.isInRole(info.user._id, "blocked")) {
		throw new Meteor.Error(403, "Your account is blocked.");
	}

  if(verifyEmail && info.user && info.user.emails && info.user.emails.length && !info.user.emails[0].verified ) {
			throw new Meteor.Error(499, "E-mail not verified.");
  }

	return true;
});


Users.before.insert(function(userId, doc) {
	if(doc.emails && doc.emails[0] && doc.emails[0].address) {
		doc.profile = doc.profile || {};
		doc.profile.email = doc.emails[0].address;
	} else {
		// oauth
		if(doc.services) {
			
				
						if(doc.services.facebook && doc.services.facebook.email) {
							doc.profile = doc.profile || {};
							doc.profile.email = doc.services.facebook.email;
						} 
							
						
					}
				}
			
		
	
});

Users.before.update(function(userId, doc, fieldNames, modifier, options) {
	if(modifier.$set && modifier.$set.emails && modifier.$set.emails.length && modifier.$set.emails[0].address) {
		modifier.$set.profile.email = modifier.$set.emails[0].address;
	}
});

Accounts.onLogin(function (info) {
	
});

Accounts.urls.resetPassword = function (token) {
	return Meteor.absoluteUrl('reset_password/' + token);
};


Accounts.urls.verifyEmail = function (token) {
	return Meteor.absoluteUrl('verify_email/' + token);
};
