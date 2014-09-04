// index.js
// Saskavi functions
//

var Firebase = require('firebase');
var colors = require('colors');
var targz = require('tar.gz');
var request = require('request');

var fs = require('fs');
var path = require('path');

var errorUUID = '881962bf-bf47-476e-a157-69078e7380df';

module.exports = {
    bind: function(appId, funcMap) {
        var fb = new Firebase("https://saskavi.firebaseio.com").child(appId).child('__saskavi-rpc');


        console.log("Processing requests...");
        fb.on('child_added', function(snap) {
            var func, args;
            try {
                var form = snap.val().form;

                console.log("Form:", form);
                func = form[0];
                args = form.slice(1);
            }
            catch(e) {
                console.log(e);
                console.log("Found a malformed queued request, must remove.");
                return snap.ref().remove();
            }

            if (!Array.isArray(args))
                return console.log("Arguments need to be an array, but they aren't, ignoring...");


            var needsCompute = !snap.hasChild("result");

            if (needsCompute) {
                console.log("Request needs computation: ", func, args);

                var writeRef = snap.child("result").ref();
                var writeError = function(desc) {
                    var r = {};
                    r[errorUUID] = desc;
                    writeRef.set(r);
                };

                var completion = function(err, res) {
                    if (err) {
                        return writeRef(err.message ||
                                        (typeof(err) === 'string'? err : "Unknown error"));
                    }

                    writeRef.set(res);
                };

                var dispatchFunc = funcMap[func];

                if (dispatchFunc) {
                    args.push(completion);
                    try {
                        if (args.length !== dispatchFunc.length) {
                            throw new Error("A function with this name was found, but the arity didn't match");
                        }

                        dispatchFunc.apply(null, args);
                    }
                    catch(e) {
                        console.log('Function Execution problem:')
                        console.log(e);
                        console.log(e.stack);

                        writeError(e.message || "Unknown Error");
                    }
                }
                else {
                    writeError("No such method");
                }
            }
            else {
                console.log("Saw a request but result is already available, ignoring...");
            }
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

            var headers = {
                'Content-Type': 'application/x-gzip'
            };

            fs.createReadStream('/tmp/saskavi-deployment.tar.gz').pipe(
                request.post({
                url: pushUrl,
                headers: headers},
                function(err, r, body) {
                    if (err)
                        return console.log(("Failed to push deployment. " + err.message).red);

                    var rr = JSON.parse(body);
                    if (rr.status) {
                        return console.log("Deployment pushed, your RPC handler is running.".green);
                    }

                    console.log(("Server deployment failed, " + (rr.message || "Unknown Error")).red);
                }));
        });
    },

    kill: function(modulePath, pushHost) {
        // figure out the firebase id from the given module
        //
        var findID = function() {
            var pack = path.join(modulePath, 'package.json');
            if (!fs.existsSync(pack))
                return null;

            var obj = JSON.parse(fs.readFileSync(pack));
            if (!obj.saskavi)
                return null;

            return obj.saskavi;
        };

        var id = findID();

        console.log("    Killing saskavi running as:".yellow, id);

        var pushUrl = "http://" + pushHost + ":16000/kill";

        request.post({
            url: pushUrl,
            headers: {
                'x-saskavi-kill-id': id
            }},
            function(err, r, body) {
                if (err)
                    return console.log(("Failed to kill: " + err.message).red);

                var rr = JSON.parse(body);
                if (rr.status)
                    return console.log("Saskavi killed.".green);

                console.log(("Failed to kill: " + (rr.message || "Unknown Error")).red);
            });
    }
};
