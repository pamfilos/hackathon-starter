var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
var mongoose = require('mongoose');
require('mongoose-moment')(mongoose);

var eventSchema = new mongoose.Schema({
  name: {type: String, required: true, trim: true },
  start: {type: 'Moment', required: true},
  end: {type: 'Moment', required: true},
  priceMin: Number,
  priceMax: Number,
  details: String,
  hotels: {type: [Number], default: 0 }
});

module.exports = mongoose.model('Event', eventSchema);
