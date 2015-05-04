var secrets = require('../config/secrets');
var expedia = require('expedia')(secrets.expedia);
var grep = require('simple-grep');

var exports = module.exports = {};

var rivalHotels = '257837,477789,465559,431030,118329, \
				119971,210217,113122,111525,261076,215213,\
				272574,119255,119254,109657,118133,129068,\
				133369,115201,189772,210218,225074,118866,\
				114699,115872,115122,135995,256982,235282';


function getDestinationInfo(destination){
	var options = {
	  "customerSessionId" : "thisisauniqueID",
	  "customerIpAddress" : "127.0.0.1",
	  "customerUserAgent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko)",
	  "LocationInfoRequest": {
	    "locale": "en_US",
	    "destinationString": destination
	  }
	};

	expedia.geoSearch(options, function(err, res){
	    if(err)throw new Error(err);
	    console.log(JSON.stringify(res));
	});	
}

function getHotelList(callback) {
	var options = {
	  "customerSessionId" : "thisisauniqueID",
	  "customerIpAddress" : "127.0.0.1",
	  "customerUserAgent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko)",
	  "HotelListRequest": {
	    "city": "Athens",
	    "countryCode": "GR",
	    "arrivalDate": "6/1/2015",
	    "departureDate": "6/5/2015",
	    "RoomGroup": {
	      "Room": { "numberOfAdults": "2" }
	    },
	    "numberOfResults": "50"
	  }
	}

	expedia.hotels.list(options, function(err, res){
	    if(err)throw new Error(err);
	    callback(err, res);
	});	
}

function getHotelListbyIDs(idList, from, to, callback) {
	var options = {
	  "customerSessionId" : "thisisauniqueID",
	  "customerIpAddress" : "127.0.0.1",
	  "customerUserAgent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko)",
	  "HotelListRequest": {
	  	"hotelIdList": idList,
	    "arrivalDate": from,
	    "departureDate": to,
	    "RoomGroup": {
	      "Room": { "numberOfAdults": "2" }
	    },
	    "numberOfResults": "50"
	  }
	}


	expedia.hotels.list(options, function(err, res){
	    if(err)throw new Error(err);
	    callback(err, res);
	});	
}

function getRivalsHotelList(from, to, callback) {
	console.log('PPPPRRRRPRPPRPRPRPRPRPR----');
	var options = {
	  "customerSessionId" : "thisisauniqueID",
	  "customerIpAddress" : "127.0.0.1",
	  "customerUserAgent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko)",
	  "HotelListRequest": {
	  	"hotelIdList": rivalHotels,
	    "arrivalDate": from,
	    "departureDate": to,
	    "RoomGroup": {
	      "Room": { "numberOfAdults": "2" }
	    },
	    "numberOfResults": "50"
	  }
	}


	expedia.hotels.list(options, function(err, res){
	    if(err)throw new Error(err);
	    callback(err, res);
	});	
}


function getHotelAvailability(hotelId, from, to, callback){
	// a complete list of options is available at http://developer.ean.com/docs/room-avail/
	console.log('±±±±±±', hotelId, from, to);
	var options = {
	  "customerSessionId" : "thisisauniqueID",
	  "customerIpAddress" : "127.0.0.1",
	  "customerUserAgent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko)",
	  "HotelRoomAvailabilityRequest": {
	    "hotelId": hotelId,
	    "arrivalDate": from,
	    "departureDate": to,
	    "RoomGroup": {
	      "Room": { "numberOfAdults": "2" }
	    }
	  }
	};

	expedia.hotels.availability(options, function(err, res){
	    if(err)throw new Error(err);
	    console.log('HEEERE', err);
	    callback(err, res);
	});


}


function getHotelFromActiveProperties(string, callback){
	var hotels = {};
	hotels['suggestions'] = [];
	grep(string, '../data/expedia/ActivePropertyListGreece.txt', function(list){
		if (list.length == 0){
			console.log('Nothing to return');
		}
		else{
			list[0].results.forEach(function(e, i){
				var line = e.line;
				var hotel = {};
				var h = line.split('|');
				hotel['EANHotelID'] = h[0];
				hotel['data'] = h[0];
				hotel['name'] = h[2];
				hotel['value'] = h[2];
				hotel['addr1'] = h[3];
				hotel['addr2'] = h[4];
				hotel['city'] = h[5];
				hotel['state'] = h[6];
				hotel['pcode'] = h[7];
				hotel['country'] = h[8];
				hotel['lat'] = h[9];
				hotel['lng'] = h[10];
				hotel['airport'] = h[11];
				hotel['category'] = h[12];
				hotel['currency'] = h[13];
				hotel['rating'] = h[14];
				hotel['confidence'] = h[15];
				hotel['location'] = h[17];
				hotel['chain'] = h[18];
				hotel['region'] = h[19];
				hotel['rateHigh'] = h[20];
				hotel['rateLow'] = h[21];
				hotel['checkInTime'] = h[22];
				hotel['checkOutTime'] = h[23];
				// hotels.push(hotel);
				hotels['suggestions'].push(hotel);
			});			
		}
		callback(null , hotels);
	});
}


exports.getHotelList = getHotelList;
exports.getHotelFromActiveProperties = getHotelFromActiveProperties;
exports.getHotelListbyIDs = getHotelListbyIDs;
exports.getHotelAvailability = getHotelAvailability;
exports.getRivalsHotelList = getRivalsHotelList;