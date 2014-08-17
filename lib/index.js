// index.js
// Saskavi functions
//

var Firebase = require('firebase');
var colors = require('colors');
var targz = require('tar.gz');
var request = require('request');

var fs = require('fs');
var path = require('path');

module.exports = {
	bind: function(url, funcMap) {
		var fb = new Firebase(url).child('__saskavi-rpc');


		console.log("Starting to listen for stuffs!");
		fb.on('child_added', function(snapshot) {
			if (!snapshot) return;

			console.log("User ID:", snapshot.name());

			// bind handler to process any requests under this node
			//
			snapshot.ref().on("child_added", function(snap) {
				var v = snap.val();

				var func = v.function;
				var args = v.args;

				if (!Array.isArray(args))
					return console.log("Arguments need to be an array, but they aren't, ignoring...");


				var needsCompute = !snap.hasChild("result");

				console.log(funcMap, typeof(args));

				if (needsCompute) {
					console.log("Request needs computation");

					var writeRef = snap.child("result").ref();
					var completion = function(err, res) {
						console.log("Completion Finished");

						if (err)
							return writeRef.set({
								error: err.message || "Unknown error"
							});

						writeRef.set(res);
					};

					console.log(args);

					if (funcMap[func]) {
						args.push(completion);
						console.log(args);
						funcMap[func].apply(null, args);
					}
					else {
						writeRef.set({error: "No such method"});
					}
				}
				else {
					console.log("Saw a request but result is already available");
				}
			});
		});
	},

	push: function(modulePath, pushHost) {
		// push module files to remote host for execution
		//
		var dir = path.dirname(modulePath);
		console.log(("    source: " + dir).yellow);

		console.log("    Creating deployment archive...".yellow);
		var compress = new targz().compress(
			dir, '/tmp/saskavi-deployment.tar.gz', function(err){
			if(err)
				return error("Sorry, failed to create deployment archive");

			var pushUrl = "http://" + pushHost + ":16000/deploy";

			// the compressed file is ready, make post request
			console.log("    Pushing deployment...".yellow);
			fs.createReadStream('/tmp/saskavi-deployment.tar.gz').pipe(
				request.post({
					url: pushUrl,
					headers: {
						'Content-Type': 'application/x-gzip'
					}}, function(err, r, body) {
						if (err)
							return console.log(("Failed to push deployment. " + err.message).red);

						var rr = JSON.parse(body);
						if (rr.status)
							return console.log("Deployment pushed, your RPC handler is running.".green);

						console.log(("Server deployment failed, " + (r.message || "Unknown Error")).red);
					}));
		});
	}
};
