var pageSession = new ReactiveDict();

pageSession.set("errorMessage", "");

Template.Login.rendered = function() {
	$("input[autofocus]").focus();
};

Template.Login.created = function() {
	pageSession.set("errorMessage", "");	
};

Template.Login.events({
	"submit #login_form": function(e, t) {
		e.preventDefault();
		pageSession.set("errorMessage", "");

		var submit_button = $(t.find(":submit"));
		submit_button.button("loading");
		
		var login_email = t.find('#login_email').value.trim();
		var login_password = t.find('#login_password').value;

		// check email [HUSSAIN - Disabled to allow taking in Healthcare Username instead of Email]
		if(!login_email && login_email == "") {
			pageSession.set("errorMessage", "Please enter your Healthcare Login Username.");
			t.find('#login_email').focus();
			return false;
		}
		
		// check password
		if(!login_password && login_password == "") {
			pageSession.set("errorMessage", "Please enter your password.");
			t.find('#login_email').focus();
			return false;
		}		
		
		// HUSSAIN - check if HC Username Valid
		Meteor.call("validateHealthcareUser", login_email.trim(), login_password.trim(), function(err, res) {
			console.log("HUSSAIN - Email sent for validation: " + login_email);
			if(!err && res) {
				console.log("HUSSAIN - Validation success for " + login_email);
				
				Session.set("currentHcUser", res);
				
				// HUSSAIN - Route to home_private view
				Router.go("home_private");
			}
			else {
				pageSession.set("errorMessage", "Please enter a valid Username and Password.");
				t.find('#login_email').focus();
				submit_button.button("reset");
				return false;				
			}
		});
		submit_button.button("reset");
		
		// HUSSAIN - Disable default login.
		/*
		Meteor.loginWithPassword(login_email, login_password, function(err) {
			submit_button.button("reset");
			if (err)
			{
				pageSession.set("errorMessage", err.message);
				return false;
			}
		});
		*/
		
		return false; 
	},
	"click #login-with-facebook": function(e, t) {
		e.preventDefault();
		pageSession.set("errorMessage", "");

		var button = $(e.currentTarget);
		button.button("loading");

		Meteor.loginWithFacebook(
			{
				requestPermissions: ["email"]
			},
			function(err) {
				button.button("reset");
				if (err) {
					pageSession.set("errorMessage", err.message);
					return false;
				}
			}
		);

		return false;
	}	
});

Template.Login.helpers({
	errorMessage: function() {
		return pageSession.get("errorMessage");
	}
	
});
