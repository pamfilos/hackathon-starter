var api = require('../lib/api');
var moment = require('moment');
var _ = require('underscore');
var async = require('async');
var forEach = require('async-foreach').forEach;
// var $ = jQuery = require('jquery');
/**
 * GET /
 * Home page.
 */
exports.index = function(req, res) {
	// overall = api.mrjson.fileToObj('../data/json/overall.json');
	async.parallel({

	},
	function(err, results){
		res.render('home', {
			title: 'Home'
		});
	});
};

exports.cityHotelOverall = function(req, res) {
	// overall = api.mrjson.fileToObj('../data/json/overall.json');
	async.parallel({
		overall: function(c){
			c(null, api.mrjson.fileToObj('../data/json/overall.json'));
		},
		medical: function(c){
			api.congress.synedriogr.medicalEvents('', '', '30', function(error, res){
				c(error, res);
			});
		},
		others: function(c){
			api.congress.synedriogr.otherEvents('', '', '30', function(error, res){
				c(error, res);
			});
		},
		hotelAvailability: function(c){
			api.protel.getRoomAvailability(function(error, rowCount, rows){
				c(error, rows);
			});
		}
	},
	function(err, results){
		res.render('cityHotelOverall', {
			title: 'Home',
			overall: results.overall,
    	mevents: results.medical,
    	oevents: results.others,
    	hotelAvailability: results.hotelAvailability
		});
	});
};

exports.chris = function(req, res) {
	async.parallel({
		overall: function(c){
			c(null, api.mrjson.fileToObj('../data/json/overall.json'));
		},
		medical: function(c){
			api.congress.synedriogr.medicalEvents(null, null, 30, function(error, res){
				c(error, res);
			});
		},
		others: function(c){
			api.congress.synedriogr.otherEvents(null, null, 30, function(error, res){
				c(error, res);
			});
		}
	},
	function(err, results){
		res.render('chris', {
			title: 'Home',
			overall: results.overall,
    	mevents: results.medical,
    	oevents: results.others
		});
	});
};

exports.getWeeksData = function(req, res) {
	overall = api.mrjson.fileToObj('../data/json/overall.json');
	date = req.query['date'];
	week = moment(date, "DD/MM/YYYY").week();
	dateFiles = [];

	async.series({
		loadFiles: function(callback){
			var files = {};
			for ( year in overall) {
				// console.log("-----"+year);
				// console.log(overall[year]);
				// console.log(overall[year][0]);
				for  (var w=0;w<(overall[year].length);w++) {
					ww =  overall[year][w];
					// console.log(ww);
					if (ww.week == week)
						if (ww.filename){
							console.log('***'+ww.filename);
							if (ww.filename instanceof Array){
								for (var f in ww.filename){
									console.log('----',ww.filename[f]);
									fnn = ww.filename[f].split("-");
									fn = fnn[fnn.length-1];
									console.log('----',fn);
									dateFiles.push(fn);
									files[fn] = [];
									files[fn].push(api.mrjson.fileToObj(ww.filename[f]+'.json'));
								}
							}
							else
								files[fn] = api.mrjson.fileToObj(ww.filename+'.json');
						}
				}
			}
			tmp = Array.prototype.concat.apply([], dateFiles);
			// console.log(files);
			results = {
				'tmp': tmp,
				'files': files
			};
			callback(null, results);
		}
	},
	function(err, results) {
		if (err) return next(err);
	  res.render('utils/dateInfo', {
	    title: 'Info',
	    date: date,
	    week: week,
    	filenames: results.loadFiles.tmp,
    	files: results.loadFiles.files
	  });
	});
};

exports.getWeeksData2 = function(req, res) {
	overall = api.mrjson.fileToObj('../data/json/overall.json');
	from = req.query['from'];
	to = req.query['to'];
	week_from = moment(from, "DD/MM/YYYY").week();
	week_to = moment(to, "DD/MM/YYYY").week();
	weeks = _.range(week_from, week_to);
	dateFiles = [];
	week = '32';

	console.log('$$=>',weeks);
	async.series({
		loadFiles: function(callback){
			var files = {};
			for ( year in overall) {
				for  (var w=0;w<(overall[year].length);w++) {
					ww =  overall[year][w];
					if (ww.week == week)
						if (ww.filename){
							console.log('***'+ww.filename);
							if (ww.filename instanceof Array){
								for (var f in ww.filename){
									fnn = ww.filename[f].split("-");
									fn = fnn[fnn.length-1];
									dateFiles.push(fn);
									files[fn] = [];
									files[fn].push(api.mrjson.fileToObj(ww.filename[f]+'.json'));
								}
							}
							else
								files[fn] = api.mrjson.fileToObj(ww.filename+'.json');
						}
				}
			}
			tmp = Array.prototype.concat.apply([], dateFiles);
			// console.log(files);
			results = {
				'tmp': tmp,
				'files': files
			};
			callback(null, results);
		}
	},
	function(err, results) {
		if (err) return next(err);
	  res.render('utils/dateInfo', {
	    title: 'Info',
	    week: week,
    	filenames: results.loadFiles.tmp,
    	files: results.loadFiles.files
	  });
	});
};


exports.getHotelAutocomplete = function(req, res) {
	var q = req.query['query'];
	console.log('------',q);
	api.expedia.getHotelFromActiveProperties(q, function(err, result){
		if (err) return next(err);
	  res.render('utils/hotelAutocomplete', {
	    title: 'Autocomplete',
	    results: result
	  });
	});
};


exports.getHotelsInfo = function(req, res) {
	var data = req.query['data'];
	var hotelsIDs = data.split(',');
	console.log(hotelsIDs);

	async.parallel({
		hotels: function(c){
			// api.expedia.getHotelList(function(err, res){
			api.expedia.getHotelListbyIDs( data ,function(err, res){
				c(err, res);
			});
		}	
	},
	function(err, results){
		res.render('utils/hotelsInfo', {
			title: 'Home',
    	hotels: results.hotels
		});
	});
};

exports.getHotelListbyIDs = function(req, res) {
	var hotelsID = req.query['id'];
	var from = req.query['from'];
	var to = req.query['to'];
	var hotelsIDs = hotelsID.split(',');
	console.log(hotelsIDs);

	async.parallel({
		hotelList: function(c){
			api.expedia.getHotelListbyIDs( hotelsID, from, to ,function(err, res){
				c(err, res);
			});
		}
	},
	function(err, results){
		res.render('utils/hotelsInfo', {
			title: 'Home',
			from: from,
			to: to,
    	hotels: results.hotelList
		});
	});
};

exports.getRivalsHotelList = function(req, res) {
	var from = req.query['from'];
	var to = req.query['to'];

	async.parallel({
		hotelList: function(c){
			api.expedia.getRivalsHotelList(from, to ,function(err, res){
				c(err, res);
			});
		}
	},
	function(err, results){
		res.render('utils/hotelsInfo2', {
			title: 'Home',
			from: from,
			to: to,
    	hotels: results.hotelList
		});
	});
};

exports.getHotelAvailability = function(req, res) {
	var hotelsID = req.query['id'];
	var from = req.query['from'];
	var to = req.query['to'];
	// var hotelsIDs = data.split(',');
	// console.log(hotelsIDs);

	async.parallel({
		hotelList: function(c){
			api.expedia.getHotelListbyIDs( hotelsID, from, to ,function(err, res){
				c(err, res);
			});
		},
		hotelsAvail: function(c){
			api.expedia.getHotelAvailability(hotelsID, from, to, function(err, res){
				c(err, res);
			});
		}	
	},
	function(err, results){
		res.render('utils/hotelAvailability', {
			title: 'Home',
    	hotelsL: results.hotelList,
    	hotelsA: results.hotelsAvail
		});
	});
};

exports.getHotelMonthAvailability = function(req, res) {
	var hotelsID = req.query['id'];
	var month = req.query['month'];
	var to = req.query['to'];
	// var hotelsIDs = data.split(',');
	// console.log(hotelsIDs);

	var monthlist = getDaysArray();
	var weeklist = getWeeksArray();
	console.log(monthlist);
	console.log(weeklist);

	var monthOverall = {};

	async.each(weeklist, function(week, callback) {
	  // Perform operation for eachday.

		api.expedia.getHotelAvailability(hotelsID, week[0], week[1], function(err, res){
			if(err)
				console.log('Error: ', err);

			console.log('RRRRRRR:',res);
			monthOverall[week] = res;
			callback();
		});
	}, function(err){
			console.log('CALLback!!');
	    // if any of the file processing produced an error, err would equal that error
	    if( err )
	      // One of the iterations produced an error.
	      // All processing will now stop.
	      console.log('A file failed to process');
		  res.render('utils/hotelMonthAvailability', {
				title: 'Home',
	    	hotelsL: monthOverall
			});
	});
};


exports.getHotelMaxAvailability = function(req, res) {
	var hotelsID = req.query['id'];
	var month = req.query['month'];
	var to = req.query['to'];
	// var hotelsIDs = data.split(',');
	// console.log(hotelsIDs);


	var periods = get28DaysArray();

	console.log(periods);

	var overall = {};

	async.each(periods, function(period, callback) {
	  // Perform operation for every 28 days

		api.expedia.getHotelAvailability(hotelsID, period[0], period[1], function(err, res){
			if(err)
				console.log('Errgggor: ', err);

			rooms = res['HotelRoomAvailabilityResponse'];
			if (rooms['@size'] <= 0 && rooms['EanWsError'] != 'SOLD_OUT'){
				temp_period = getPeriodHalves(period[0], period[1]);
				getHotelPeriodsAvailability
				console.log(temp_period);
			}
			console.log('RRRRRRR:',res);
			overall[period] = res;
			callback();
		});
	}, function(err){
			console.log('CALLback!!');
	    // if any of the file processing produced an error, err would equal that error
	    if( err )
	      // One of the iterations produced an error.
	      // All processing will now stop.
	      console.log('A file failed to process');
		  res.render('utils/hotelMonthAvailability', {
				title: 'Home',
	    	hotelsL: overall
			});
	});
};

exports.msr = function(req, res) {
	// overall = api.mrjson.fileToObj('../data/json/overall.json');
	async.parallel({
		month: function(c){
			var date = moment();
			c(null, date);
		},
		hotelInfo: function(c) {
			var hotels = api.protel.getHotelInfo();
			async.each(
				hotels,
				function(hotel, cb){
					hotel['rooms'] = _.where(hotel['rooms'], {"status" : true});
					cb();
				}, 
				function(error){
					c(null, hotels);
				});
		},
		// hotelRooms: function(c){
		// 	c(null, api.protel.getRooms());
		// },
		hotelMonthGroup: function(c){
			api.protel.getCurrentMonthGroup(function(error, results){
    			console.log('------we are here 2222 ----');
				c(error, results);
			});
		},
		events: function(c){
			api.protel.getEventsAgendaCurrentMonth(function(error, results){
				c(error, results);
			})
		}

		//,
		// hotelAvailability: function(c){
		// 	api.protel.getAndUpdateObjectWithDates('./lib/proteloverall.json',function(error, results){
		// 		c(error, results);
		// 	});
		// }
	},
	function(err, results){
	    console.log('------we are here 33333 ----');
		res.render('msr', {
			title: 'Home',
			month: results.month,
			hotels: results.hotelInfo,
			// hotelInfo: results.hotelInfo.hotel,
			// hotelInfo: results.hotelInfo,
			// hotelRooms: results.hotelRooms,
			hotelMonthGroup: results.hotelMonthGroup,
			events: results.events
    		// hotelAvailability: results.hotelAvailability
		});
	});
};

exports.msrMonth = function(req, res) {
	// overall = api.mrjson.fileToObj('../data/json/overall.json');
	async.parallel({
		// hotelRooms: function(c){
		// 	c(null, api.protel.getRooms());
		// },
		month: function(c){
			var date = moment(req.query['month']);
			c(null, date);
		},
		hotelInfo: function(c) {
			var hotels = api.protel.getHotelInfo();
			async.each(
				hotels,
				function(hotel, cb){
					hotel['rooms'] = _.where(hotel['rooms'], {"status" : true});
					cb();
				}, 
				function(error){
					c(null, hotels);
				});
		},
		hotelMonthGroup: function(c){
			api.protel.getPriceCalculationsGroup(req.query['month'],function(error, results){
				c(error, results);
			});
		},
		events: function(c){
			api.protel.getEventsAgendaMonth(req.query['month'],function(error, results){
				c(error, results);
			})
		}
	},
	function(err, results){
		res.render('utils/msrMonths', {
			title: 'Home',
			month: results.month,
			hotels: results.hotelInfo,
    		hotelRooms: results.hotelRooms,
    		hotelMonthGroup: results.hotelMonthGroup,
			events: results.events
		});
	});
};

getHotelPeriodsAvailability = function(hotelID, from, to) {
	var period_overall = {};
	period_overall['from'] = from;
	period_overall['to'] = to;
	api.expedia.getHotelAvailability(hotelID, from, to, function(err, res){
		if(err)
			console.log('Error: ', err);

		period_overall['response'] = res;
		rooms = res['HotelRoomAvailabilityResponse'];
		if (rooms['@size'] <= 0 && rooms['EanWsError'] != 'SOLD_OUT'){
			halves = getPeriodHalves(from, to);
			var child_overall = {};
			async.each(halves, function(half, callback){
				child_overall[half] = getHotelPeriodsAvailability(hotelID, half[0], half[1]);
			}, 
			function(err){
				period_overall['child'] = child_overall;
			});
		}
		return overall[from+','+to] = res;
	});
}



var get28DaysArray = function() {
  var date = moment();
  var month = date.month();
  var result = [];
  result.push([ date.format('MM/DD/YYYY'), date.add(28, 'days').format('MM/DD/YYYY') ]);
  // _.times(17,function(){
  //   result.push([ date.format('MM/DD/YYYY'), date.add('days',28).format('MM/DD/YYYY')]);
  // });
  return result;
}

var getPeriodHalves = function(from, to) {
  var from = moment(from,'MM/DD/YYYY');
  var to = moment(to,'MM/DD/YYYY');
  var result = [];
  result.push([ from.format('MM/DD/YYYY'), from.add(to.diff(from, 'days')/2, 'days').format('MM/DD/YYYY') ]);
  result.push([ from.format('MM/DD/YYYY'), to.format('MM/DD/YYYY')]);
  return result;
}

var getWeeksArray = function() {
  var date = moment();
  var month = date.month();
  var result = [];
  result.push([ date.format('MM/DD/YYYY'), date.endOf('week').format('MM/DD/YYYY') ]);
  date = date.add(7,'days');
  while (date.month() == month) {
    result.push([ date.startOf('week').format('MM/DD/YYYY'), date.endOf('week').format('MM/DD/YYYY') ]);
    date = date.add(7,'days');
  }
  return result;
}

var getDaysArray = function() {
  var date = moment();
  var month = date.month();
  var result = [];
  while (date.month() == month) {
    result.push(date.format('MM/DD/YYYY'));
    date = date.add(1, 'days');
  }
  return result;
}

