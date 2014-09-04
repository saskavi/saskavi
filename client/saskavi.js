// saskavi.js
// client side script for calling saskavi functions
//

var Firebase = require("client-firebase");
var errorUUID = '881962bf-bf47-476e-a157-69078e7380df';

var Saskavi = function(appId) {
    this.rpcBus = new Firebase("https://saskavi.firebaseio.com").child(appId).child("__saskavi-rpc");
};

function isFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

function isObject(o) {
    return Object.prototype.toString.call(o) === '[object Object]';
}

Saskavi.prototype.call = function() {
    var params = Array.prototype.slice.call(arguments, 0);

    if (arguments.length === 0)
        throw new Error("Saskavi calls expect atleast two paramters: a function name and a callback");

    if (!isFunction(params[params.length - 1]))
        throw new Error("Callback function as last parameter is required, promises may come soon");

    var cb = params[params.length - 1];

    var form = params.slice(0, params.length - 1);

    var rpcData = {
        "form": form,
    };

    var rpcRef = this.rpcBus.push(rpcData);
    var resultRef = rpcRef.child('result');

    resultRef.on('value', function(snapshot) {
        if (snapshot !== null && snapshot.val() !== null) {
            resultRef.off('value');

            var result = snapshot.val();

            // if we got an error back, marshal it correctly
            if (typeof result === 'object' &&
                result[errorUUID])
                return cb (new Error(result[errorUUID]));

            cb(null, snapshot.val());
        }
    });
};

window.Saskavi = Saskavi;
