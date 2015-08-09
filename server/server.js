
var verifyEmail = false;
var jsonResponse = null;
Accounts.config({ sendVerificationEmail: verifyEmail });

  

Meteor.startup(function() {
console.log(Meteor.users.find());
	// read environment variables from Meteor.settings
	if(Meteor.settings && Meteor.settings.env && _.isObject(Meteor.settings.env)) {
		for(var variableName in Meteor.settings.env) {
			process.env[variableName] = Meteor.settings.env[variableName];
		}
	}
	
	//
	// Setup OAuth login service configuration (read from Meteor.settings)
	//
	// Your settings file should look like this:
	//
	// {
	//     "oauth": {
	//         "google": {
	//             "clientId": "yourClientId",
	//             "secret": "yourSecret"
	//         },
	//         "github": {
	//             "clientId": "yourClientId",
	//             "secret": "yourSecret"
	//         }
	//     }
	// }

		// facebook
		//if(Meteor.settings.oauth.facebook && _.isObject(Meteor.settings.oauth.facebook)) {
			// remove old configuration
			//Accounts.loginServiceConfiguration.remove({
				//service: "facebook"
			//});

			//var settingsObject = Meteor.settings.oauth.facebook;
			//settingsObject.service = "facebook";

			// add new configuration
			//Accounts.loginServiceConfiguration.insert(settingsObject);
		//}
		
		
	
});

var  j=0;
Meteor.methods({

	"getPolicyRecords": function(email_id){


	
		 jsonResponse = Meteor.http.call('GET', 'http://demo3065031.mockable.io/NASTYDATA');
		 	 console.log(JSON.parse(jsonResponse.content));
		for (i = 0; i < 1000; i++) 
	 {
	 console.log(JSON.parse(jsonResponse.content).userA[i].EmailId);
			if(Meteor.user().profile.email==JSON.parse(jsonResponse.content).userA[i].EmailId)
			{
			if(j!=1)
			{
						 jsonResponse = JSON.parse(jsonResponse.content).userA[i];
						 console.log(jsonResponse.PolicyNumber);
						break;
						j++;
					}	
			}
			
	}

		return jsonResponse;
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

Accounts.onCreateUser(function (options, user) {
	user.roles = [];

	if(options.profile) {
		user.profile = options.profile;
	}

	
	return user;
});

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
