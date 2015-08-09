Template.HomePrivate.rendered = function() {
	
//var userEmail = "mhrjan@gmail.com";
	//			Meteor.call("getpolicyrecords", userEmail, function(e,results) { 
				// console.log(JSON.parse(results));
		//		});
			
};

Template.HomePrivate.events({
	
});

Template.HomePrivate.helpers({

'getRecords' : function()
{
	var userEmail="";
	Meteor.call("getPolicyRecords", userEmail, function(e,results) { 
	 
						Session.set("getRecordsObjects",results);
						
					
						
						
			

				
	});

	return Session.get("getRecordsObjects");
}

});
