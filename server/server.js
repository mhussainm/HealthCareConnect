var verifyEmail = false;

Accounts.onCreateUser(function(options, user) {
    // We still want the default hook's 'profile' behavior.
    console.log("HUSSAIN - In Accounts.onCreateUser");
    if (options.profile) {
        user.profile = options.profile;
        user.profile.memberSince = new Date();

        // Copy data from Facebook to user object
        user.profile.facebookId = user.services.facebook.id;
        user.profile.firstName = user.services.facebook.first_name;
        user.profile.email = user.services.facebook.email;
        user.profile.link = user.services.facebook.link;
        user.profile.fbAccessToken = user.services.facebook.accessToken;

		//Calling Graph Fb to get current location and hometown
		var fbInfo = HTTP.get("https://graph.facebook.com/me/?" 
					+ "fields=location,hometown", 
					{params: {access_token: user.services.facebook.accessToken}}).data;					
											
		if( fbInfo &&fbInfo.location) {
			user.profile.fbCurrentCity = fbInfo.location.name;
		}
        
        // Also link HcUsers
        var hcUser = HcUsers.findOne({EmailId: user.services.facebook.email});
        
        if(hcUser) {
        	console.log("HUSSAIN hcUser match found for " + hcUser.PolicyHolderName);
        	user.profile.hcPolicyNumber = hcUser.PolicyNumber;
        	user.profile.hcInsCompany = hcUser.InsuranceCompany;
        	user.profile.hcPolicyHolderName = hcUser.PolicyHolderName;
        	user.profile.hcPolicyFrom = hcUser.PolicyFrom;
        	user.profile.hcPolicyTo = hcUser.PolicyTo;        	
        }
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
	
	HcUsers = new Mongo.Collection("hcUsers");
	FbPosts = new Mongo.Collection("fbPosts");
	HcMessages = new Mongo.Collection("hcMessages");		
});

Meteor.publish("healthCareUser", function(){
	HcUsers.find({});	
});

Meteor.methods({
	"sendPushNotification": function() {
		var usersWithRegisteredDevice = Meteor.users.find( { regid: { $exists: true } } ).fetch();
		console.log('HUSSAIN - In server sendPushNotification()');
		return App.notificationClient.sendNotification(usersWithRegisteredDevice, {
			title: "You're on the move; have fun!",
			message: "Currently the weather at Mumbai, India is 'warm' , we urge you to keep your arrangements ready. Stay safe, Happy journey!"
		});		
	},
	"fbFetchInfo": function() 
	{
		if(Meteor.users)
		{
			Meteor.users.find().forEach(function(user)
			{
				var accessToken = user.services.facebook.accessToken;
				if(accessToken) 
				{
					var fbInfo = HTTP.get("https://graph.facebook.com/me/?" 
											+ "fields=id,name,location,hometown", 
											{params: {access_token: accessToken}}).data;
					console.log(fbInfo);
					if(fbInfo) 
					{
						if(fbInfo.location) 
						{
							console.log("inside 1"+user.profile.fbCurrentCity);
							console.log("inside 2"+fbInfo.location.name);
							
							if (user.profile.fbCurrentCity && 
									user.profile.fbCurrentCity 
													!== fbInfo.location.name) 
							{
								console.log("inside")
									var offers=Meteor.http.call('GET','http://demo5522401.mockable.io/HealthcarePromotions');
									var value= Math.floor(Math.random() * 7) + 1;
									var responseFromAPI = "";
									if(value>0 && value <=7)
									{
										responseFromAPI = JSON.parse(offers.content).hcPromotionalOffers[value];
										console.log("offer 1"+JSON.parse(offers.content).hcPromotionalOffers[value]);
									}
									else{
										responseFromAPI = JSON.parse(offers.content).hcPromotionalOffers[0];
										console.log("offer 1"+JSON.parse(offers.content).hcPromotionalOffers[0]);
									}
									
									var messageTitle = "Did you know?";
									
									// Send PUSH Notification
									try {
										console.log("HUSSAIN - Sending Push Notification for MSG:" + responseFromAPI );
										var res = App.notificationClient.sendNotification(Meteor.users.findOne({ _id: user._id }) , {
													title: messageTitle,
													message: responseFromAPI			
										});       
					
										console.log(res);				
					
										if(res && res.userCount) {
											console.log("Push Notification Sent " + res.userCount);
										}   
									} catch(error) {
										console.log("Error while sending Push notification: " + error.message);
									}									
									
									var facebookPostId = user.services.facebook.id+"not_a_post";
									var createdTS = moment(new Date()).format("MM-DD-YY"+" at "+"hh:mm a");
									HcMessages.insert({
											userId: user._id,
											createdAt:createdTS,
											facebookUserId: user.services.facebook.id,
											facebookPostId: facebookPostId,
											message_title:messageTitle,
											message_text: responseFromAPI,
											message_read_ind: 0
										});
						
									console.log("Fb Event: User has moved to " + fbInfo.location.name);
							}
						}
						
						if(fbInfo.location && fbInfo.location.name) 
						{
							Users.update({ _id: user._id }, 
								{ $set: { 'profile.fbCurrentCity': fbInfo.location.name }});						
						}
						
						if (fbInfo.hometown && fbInfo.hometown.name) 
						{
							Users.update({ _id: user._id }, 
								{ $set: { 'profile.fbHometown': fbInfo.hometown.name }});						
						}
					}
					else
					{
						throw "FB Setup or Access Token unavailable";
 					}
				}
				else 
				{
					throw "User unavailable";
				}
			});
		}	
	},
	
	"getNotificationCount": function(post) {
		if(Meteor.user() && Meteor.user().services && Meteor.user().services.facebook) {
			console.log("count+"+
			HcMessages.find({ facebookUserId: Meteor.user().services.facebook.id, message_read_ind: 0 }).count())
			return HcMessages.find({facebookUserId: Meteor.user().services.facebook.id, 
											message_read_ind: 0 }).count();
		}		
	},
	
	"updateReadMessages": function(post) {
		if(Meteor.user() && Meteor.user().services && Meteor.user().services.facebook) {
			HcMessages.update(
				{ facebookUserId: Meteor.user().services.facebook.id }, 
			
				{ $set: { message_read_ind: 1 }},
				{ multi:true }
			);
		}
	},
	
	"getLatestPost": function() {
		if(Meteor.users) {
			Meteor.users.find().forEach(function(user) {
				var post= FbPosts.find({ userId: user._id },
									{ sort:{ created: -1 },limit: 1 }).fetch()[0];
					
					var duplicatePostIndicator = HcMessages.find({facebookPostId: post._id}).count();
					console.log("duplicatePostIndicator"+duplicatePostIndicator);
					console.log("user._id"+user._id);
					if(duplicatePostIndicator === 0)
					{					
						var messageInLowerCase = post.message.toLowerCase();
						var storyInLowerCase = post.story.toLowerCase();
					
						var isTravelling = false;
						var messageToParse = "";			
						if(messageInLowerCase.indexOf("travel") > -1) {
							isTravelling = true;
							messageToParse = messageInLowerCase.substr(messageInLowerCase.indexOf("travel"));
						}
						if(storyInLowerCase.indexOf("travel") > -1) {
							isTravelling = true;
							messageToParse = storyInLowerCase.substr(storyInLowerCase.indexOf("travel"));						
						}

						if(isTravelling) {
							var travelArray = messageToParse.split("to");
							var location = travelArray[1];
							var address=Meteor.http.call('GET','http://maps.google.com/maps/api/geocode/json?address='+location+'&sensor=false');

							console.log("Prepared GPS Coordinates - LAT ::"+ JSON.parse(address.content).results[0].geometry.location.lat);
							console.log("Prepared GPS Coordinates - LNG ::"+ JSON.parse(address.content).results[0].geometry.location.lng);

							var lattitude=JSON.parse(address.content).results[0].geometry.location.lat;
							var longitude=JSON.parse(address.content).results[0].geometry.location.lng;

							var weather=Meteor.http.call('GET','http://api.openweathermap.org/data/2.5/weather?lat='+lattitude+'&lon='+longitude);

							console.log('Weather is-->'+JSON.parse(weather.content).weather[0].description);
							
							var climate=JSON.parse(weather.content).weather[0].description;
							
							//Prepare the message according to response of Weather API
							var messageText = "Currently the weather at " + location+" is " + climate + " , we urge you to keep your arrangements ready. Stay safe, Happy journey!";
							var messageTitle="";
							var sentimentValueFromAzureML = post.sentimentValueFromAzureML;
							console.log("sentimentValueFromAzureML before preparing message title"+sentimentValueFromAzureML);
							//Preparing message title with help of azure message learning.
							if(sentimentValueFromAzureML > 0.6)
							{
								messageTitle = "You're on the move; have fun!";
							}
							else if(sentimentValueFromAzureML < 0.6 
										&& sentimentValueFromAzureML > 0.4)
							{
								messageTitle = "Have a safe travel.";
							}
							else
							{
								messageTitle = "Travels are not always fun";
							}
							
							
							// Send PUSH Notification
							try {
								console.log("HUSSAIN - Sending Push Notification for MSG:" + messageText );
								var res = App.notificationClient.sendNotification(Meteor.users.findOne({ _id: user._id }) , {
											title: messageTitle,
											message: messageText			
								});       
							
								console.log(res);				
							
								if(res && res.userCount) {
									console.log("Push Notification Sent " + res.userCount);
								}   
							} catch(error) {
								console.log("Error while sending Push notification: " + error.message);
							}
							
							// Insert in DB
							var insertedRow = HcMessages.findOne({facebookUserId: user.services.facebook.id});
							var createdTS = moment(new Date()).format("MM-DD-YY"+" at "+"hh:mm a");
							if(!insertedRow)
							{
								HcMessages.insert({
												userId: user._id,
												createdAt:createdTS,
												facebookUserId: user.services.facebook.id,
												facebookPostId: post._id,
												message_title:messageTitle,
												message_text:messageText,
												message_read_ind: 0
											});
							
							}				
						}									
					}
				});
		}
	},
	
	"fbFetchPosts": function() {
		if(Meteor.users) {
		    Meteor.users.find().forEach(function(user) {
				if (user.services && user.services.facebook) {
					var accessToken = user.services.facebook.accessToken;
					if(accessToken) {
						var fbPosts = HTTP.get("https://graph.facebook.com/me/posts", 
												{params: {access_token: accessToken}}).data;

						if(fbPosts && fbPosts.data && fbPosts.data.length > 0) {
							var post;							
							for(i = 0; i < fbPosts.data.length; i++) {
								post = fbPosts.data[i];
								/*
									Start of Azure Machine Learning - getSentiments Call.
									We are going to store the sentiment score of each post in the DB.
								*/
								var sentimentValueFromAzureML=0;
								if(post.message)
								{
									 var options = {
													headers :
													{
														'Authorization':' Basic YWNjb3VudEtleTpNNHJMclhxRlFlN1hrcVNHWHZjbkVYSWFiWFE0cTNmTUFUT2JqVlBFb2ZJ',						
														'Content-Type': 'application/json'
													}	
												};
									var textToCheckSentimentOn = post.message;
									var sentimentObject = 
												Meteor.http.call("GET","https://api.datamarket.azure.com/amla/text-analytics/GetSentiment?text="+textToCheckSentimentOn , options);
									sentimentValueFromAzureML = JSON.parse(sentimentObject.content).Score;
									console.log("sentimentValueFromAzureML"+sentimentValueFromAzureML);
								}
								/*
									End of Azure Machine Learning - getSentiments Call
								*/
								
								if(!post.story) {
									post.story = "";
								}
									
								try {	
									FbPosts.update({ _id: post.id }, 
									{
										_id: post.id,
										created: post.created_time,
										sentimentValueFromAzureML:sentimentValueFromAzureML,
										userId: user._id,
										facebookId: user.services.facebook.id,
										message: post.message,
										story: post.story
									}, { upsert: true });						
								}							
								catch(error) {
									// do nothing
									console.log(error);
								}								
							}												
						}
						else 
						{
							console.log("No FB Posts available");
						}														
					}
				}
				else
				{
					throw "FB Setup or Access Token unavailable";
				}	
			});
		}	
	},
		
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
								
							try {
								// Insert  the logged in user															
								HcUsers.insert(hcRecords[i]);							
							}
							catch(error) {
								// do nothing
							}
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
