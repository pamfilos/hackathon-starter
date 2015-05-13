var api = require('../lib/api');
var moment = require('moment');
var _ = require('underscore');
var async = require('async');
var forEach = require('async-foreach').forEach;
var Event = require('../models/Event');



exports.index = function(req, res) {
	// overall = api.mrjson.fileToObj('../data/json/overall.json');
	async.parallel({
		hotelNames: function(c) {
			var hotels = api.protel.getHotelNames();
			c(null, hotels);
		},
		hotelInfo: function(c) {
			var hotels = api.protel.getHotelInfo();
			c(null, hotels);
		},
		events: function(c){
			Event.find( function(error, results){
				if (error) c(error, null);
				c(error, results);
			});
		}
	},
	function(err, results){
		console.log('------we are here 33333 ----');
		res.render('event/index', {
			title: 'Events',
			hotels: results.hotelInfo,
			hotelNames: results.hotelNames,
			events: results.events
		});
	});
};

exports.getAdd = function(req, res) {
	async.parallel({
		hotelInfo: function(c) {
			var hotels = api.protel.getHotelInfo();
			c(null, hotels);
		}
	},
	function(err, results){
		res.render('event/add', {
			title: 'Add Event',
			hotels: results.hotelInfo,
		});
	});
};

exports.postAdd = function(req, res, next) {
	req.assert('event-name-input', 'Event name is required').notEmpty();
	req.assert('event-date-field-from', 'Event "From" date is invalid').notEmpty().isDate();
	req.assert('event-date-field-to', 'Event "To" date is invalid').notEmpty().isDate();

	var errors = req.validationErrors();

	if (errors) {
		req.flash('errors', errors);
		return res.redirect('/events/add');
	}

	var event = new Event({
		name: req.body['event-name-input'],
		start: moment(req.body['event-date-field-from'], 'DD/MM/YYYY'),
		end: moment(req.body['event-date-field-to'], 'DD/MM/YYYY'),
		priceMin: req.body['event-price-range-from'],
		priceMax: req.body['event-price-range-to'],
		details: req.body['event-details-input'],
		hotels: req.body['hotel-checkbox']
	});

	Event.findOne({ name: req.body['event-name-input'] }, function(err, existingEvent) {
		if (existingEvent) {
			req.flash('errors', { msg: 'Event with that name already exists.' });
			return res.redirect('/events/add');
		}
		event.save(function(err) {
			if (err) return next(err);
			res.redirect('/events');
		});
	});
}


// ###### [ TOBEFIXED ] ########
exports.postDelete = function(req, res, next) {
	console.log('this is :',req.body);
	if (req.isAuthenticated() && req.user.profile.role == 'admin'){
		Event.remove({ _id : req.body['delete-hidden-evid']}, function(err) {
			if (err) return next(err);
			res.status(200).end();
		});
	}
	else {
		req.flash('error', {msg: 'You must have \'admin\' rights to delete an event' });
		res.send(202).end();
	}
	
}

