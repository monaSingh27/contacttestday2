

var s    = require('server');
var mongoose = require('mongoose');


var userContact= s.decoded.name;



var Schema  = mongoose.Schema;

var contactschema  = new Schema({
	name: String,
	email: String,
	mobileno: Number

});

module.exports = mongoose.model('userContact', contactschema);


