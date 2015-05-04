var fs = require('fs');

var exports = module.exports = {
	fileToObj: function (filename) {
		var obj;
		obj = JSON.parse(fs.readFileSync(filename, 'utf8'));
		return obj;
	},
};
