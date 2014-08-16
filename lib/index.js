// index.js
// Saskavi functions
//

var Firebase = require('firebase');


var createFuncLookup = function(funcMap) {
	var funcTable = {};

	for (var k in funcMap) {
		funcTable[k] = funcMap[k];
		// go though each function
		//for (var f in funcMap[k]) {
			// TODO: Should not ignore functions which already exist
			// TODO: Should look for initializers in modules
			//funcTable[f] = funcMap[k][f];
		//}
	}

	return funcTable;
};

module.exports = {
	bind: function(url, funcMap) {
		var lookup = createFuncLookup(funcMap);
		console.log(funcMap, lookup);

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

				console.log(lookup, typeof(args));

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

					if (lookup[func]) {
						args.push(completion);
						console.log(args);
						lookup[func].apply(null, args);
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
	}
};
