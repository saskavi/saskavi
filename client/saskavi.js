// saskavi.js
// client side script for calling saskavi functions
//

var Firebase = require("client-firebase");

var Saskavi = function(appId) {
	this.rpcBus = new Firebase("https://saskavi.firebaseio.com").child(appId).child("__saskavi-rpc");
};

function isFunction(functionToCheck) {
	var getType = {};
	return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

Saskavi.prototype.call = function() {
	var params = Array.prototype.slice.call(arguments, 0);

	var funcName = params[0];

	if (!isFunction(params[params.length - 1]))
		throw new Error("Callback function as last parameter is required, promises may come soon");

	var cb = params[params.length - 1];

	console.log(params);
	var ps = params.slice(1, params.length - 1);
	console.log(ps);

	var rpcData = {
		"function": funcName,
		"args": ps
	};

	var rpcRef = this.rpcBus.push(rpcData);
	var resultRef = rpcRef.child('result');

	resultRef.on('value', function(snapshot) {
		if (snapshot !== null && snapshot.val() !== null) {
			resultRef.off('value');
			cb(null, snapshot.val());
		}
	});
};

window.Saskavi = Saskavi;
