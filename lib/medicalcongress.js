var cheerio = require('cheerio');
var moment = require('moment');
var request = require('request');
var async = require('async');
var ical = require('ical');
require("datejs");
var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

var exports = module.exports = {};

// Set the headers
var headers = {
	'User-Agent':       'Super Agent/0.0.1',
	'Content-Type':     'application/form-data'
};

// Configure the request
var options = {
    url: '',
    method: 'POST',
    headers: headers,
    form: {
		'scope[0]': '',
		'scope[1]': '',
		'action': 'search_events',
		'category': '30'
	}
};

var url = {
	eventsgr : 'http://www.events.gr/events/future-events?format=raw&type=ical'
};
var from = "";
var to = "";
var synedriogr = {
	getEvents : function(url, from, to, category, callback){
		options.url = url;
		options.form = {
			'scope[0]': from,
			'scope[1]': to,
			'category': category
		};
		var l = '';
		// Start the request
		request(options, function (error, response, body, call) {
		    if (!error) {
	        var $ = cheerio.load(body);
	        var events = $("table.events-table");
					var eventhtml = '<table>'+events.html()+'</table>';
					var eventjson = [];
					async.waterfall([
						function(c){
							eventjson = table2json(body);
							c(null, eventjson);
						},
						function(json, c){
							c(null, json);				
						}
					],
					function(e, r) {
						callback(e, r);
					});
		    }
		});
	},
	medicalEvents : function(from, to, category, callback){
		this.getEvents('http://www.medicalcongress.gr/', from, to, category, callback);
	},
	otherEvents : function(from, to, category, callback){
		this.getEvents('http://www.synedrio.gr/%CF%83%CF%85%CE%BD%CE%AD%CE%B4%CF%81%CE%B9%CE%B1-%CE%B5%CE%BB%CE%BB%CE%AC%CE%B4%CE%B1/', from, to, category, callback);
	}
};

var eventsgr = {
	getEvents : function(url){
		cal2json(url);
	}
};

function table2json(html) {
    var jsonResponse = [];
    var $ = cheerio.load(html);

    $('table').each(function(i, table) {
        var tableAsJson = [];
        // Get column headings
        // @fixme Doesn't support vertical column headings.
        // @todo Try to support badly formated tables.
        var columnHeadings = [];
        $(table).children('thead').children('tr').each(function(i, row) {
            $(row).children('th').each(function(j, cell) {
                columnHeadings[j] = $(cell).text().trim();
            });
        });

        // Fetch each row
        $(table).children('tbody').children('tr').each(function(i, row) {
            var rowAsJson = {};

            $(row).children('td').each(function(j, cell) {
            	if (j==0){
            		var date = $(cell).text().trim();
            		date = date.split('-');
            		if (date.length == 2) {
            			rowAsJson['start'] = moment(date[0].trim(), 'DD/MM/YYYY').toString('yyyy-MM-dd');
            			rowAsJson['end'] = moment(date[1].trim(), 'DD/MM/YYYY').toString('yyyy-MM-dd');
            		}
            		else{
            			rowAsJson['start'] = moment(date[0].trim(), 'DD/MM/YYYY').toString('yyyy-MM-dd');
            			rowAsJson['end'] = moment(date[0].trim(), 'DD/MM/YYYY').toString('yyyy-MM-dd');
            		}
            	}
            	else{
		            rowAsJson['link'] = $(cell).children('strong').children('a').attr('href');
		            rowAsJson['location'] = $(cell).children('i').text().trim();
		            rowAsJson['title'] = $(cell).children('strong').children('a').text().trim();
            	}
            });
            
            // Skip blank rows
            if (JSON.stringify(rowAsJson) != '{}')
                tableAsJson.push(rowAsJson);
        });
        
        // Add the table to the response
        if (tableAsJson.length != 0)
            jsonResponse.push(tableAsJson);
    });
	
    return jsonResponse;
};


function cal2json(url){
	ical.fromURL(url, {}, function(err, data) {
		for (var k in data){
			if (data.hasOwnProperty(k)) {
				var ev = data[k]
				console.log(ev);
				// console.log("Conference",
				// 	ev.summary,
				// 	'is in',
				// 	ev.location,
				// 	'on the', ev.start.getDate(), 'of', months[ev.start.getMonth()]);
			}
		}
	});	
};

module.exports.synedriogr = synedriogr;


// eventsgr.getEvents(url.eventsgr);
