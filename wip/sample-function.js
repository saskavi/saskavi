// A function to process stripe payments
//

var stripe = require("");
var KEY = '1231423124123';

var onLoad = function() {
	stripe.init(KEY);
};

var processPayment = function(token, userid, done) {
	stripe.charge(token, userid, 499, function() {
		done(true);
	});
};
