// this is supposed to be private since you don't want to give this to everybody
//

var request = require("request");
var slackPostURL = "<put an incoming hook URL here>";

module.exports.sendMessageToSlack = function(msg, cb) {
	// assuming that message is in standard slack format
	console.log("Posting!");
	request.post(slackPostURL, {
		form: {payload: JSON.stringify(msg)}
	}, function(err, r, body) {
		console.log(err, r, body);
		if (err) return cb(err);
		cb();
	});
};
