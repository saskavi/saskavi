module.exports.reverse = function(s, done) {
	done(null, s.split("").reverse().join(""));
};
