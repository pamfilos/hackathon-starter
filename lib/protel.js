var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var fs = require('fs');
var mrjson = require('./mrjson');
var moment = require('moment');
var momentRange = require('moment-range');
var async = require('async');
var _ = require('underscore');

var protelFile = './lib/proteloverall.json';
var hotelConfigFile = './lib/hotels.conf';
var results;

var config = {
  server: '200.0.0.60',
  userName: 'pam_read',
  password: '123456789',
  options: {
    rowCollectionOnRequestCompletion: true,
    useColumnNames: true
  }
  /*
  ,options: {
    debug: {
      packet: true,
      data: true,
      payload: true,
      token: false,
      log: true
    },
    database: 'DBName',
    encrypt: true // for Azure users
  }
  */
};

var availabilityCal;
var hotels = [];
var hotel_ids = [];
var hotelRooms;

var executeStatementMSSQL = function(query, callback){
  var connection = new Connection(config);
  connection.on('connect', function(err) {
    var request = new Request(query, function(err, rowCount, rows) {
      if (err) {
        console.log(err);
      } else {
        // console.log(rowCount + ' rows');
        callback(err, rowCount, rows);
      }
      connection.close();
    });
    connection.execSql(request);
  });
};

function getHotelRoomsFromDB(next){
  var q = "select belegung.mpehotel,kat.kat, kat.bez \
           from proteluser.belegung \
           left outer join proteluser.kat on (belegung.katnr = kat.katnr) \
           where  kat.zimmer =1 \
           group by kat.kat, kat.bez, belegung.mpehotel";

  // var q = "SELECT kat.kat, kat.bez \
  //         FROM proteluser.belegung \
  //         LEFT OUTER JOIN proteluser.kat ON (belegung.katnr = kat.katnr) \
  //         WHERE kat.zimmer =1 \
  //         GROUP BY kat.kat, kat.bez";

  executeStatementMSSQL(q, function(err, rc, rows){
    var roomOverview = {};
    for (var i=0 ; i<rows.length ; i++){
      var row = rows[i];
      var hotel = row['mpehotel']['value'];
      if (roomOverview[hotel] == undefined){
        roomOverview[hotel] = {};
        roomOverview[hotel].rooms = [];  
      }

      roomOverview[hotel].rooms.push({cat : row['kat']['value'], desc : row['bez']['value'] })
    }

    // console.log('ROOMOVERALL####:',roomOverview);
    hotelRooms = roomOverview;
    next();
  });
}

function getHotelInfoFromConfig(next){
  getObjectFromFile(hotelConfigFile, function(err, object){
    if (object['hotels'])
      hotels = object['hotels'];
      hotel_ids = _.pluck(hotels, 'id');
  });

  next();
}

function getHotelIDsFromFile(){
  var hotel_ids = _.pluck(hotels, 'id');
}

function getHotelInfo() {
  return hotels;
}



function getRoomAvailabilityGroup(callback){
  var q = "SELECT kat.kat,belegung.datum, belegung.katnr, belegung.anzahl "+
          "FROM proteluser.belegung "+
          "LEFT OUTER JOIN proteluser.kat ON (belegung.katnr = kat.katnr) ";

  executeStatementMSSQL(q, callback);
}

function getRoomAvailabilityHotel(hotelId, callback){
  var q = "SELECT kat.kat,belegung.datum, belegung.katnr, belegung.anzahl "+
          "FROM proteluser.belegung "+
          "LEFT OUTER JOIN proteluser.kat ON (belegung.katnr = kat.katnr) "+
          "WHERE  belegung.mpehotel = "+hotelId;

  executeStatementMSSQL(q, callback);
}

function writeCurrentRoomAvailabilityGroup(){
  var q = "SELECT kat.kat,belegung.datum, belegung.katnr, belegung.anzahl \
          FROM protel.proteluser.belegung \
          LEFT OUTER JOIN protel.proteluser.kat ON (belegung.katnr = kat.katnr) \
          WHERE belegung.datum>dateadd(day, -1, getdate()) and belegung.anzahl!=0 \
          order by datum" ;

  executeStatementMSSQL(q, function(e, rowCount, rows){
    if (e){
      console.log("Can't write to file: ERROR WITH DATABASE");
    }
    else {
      writeResultToFile(rows);
    }
  });
}

function writeCurrentRoomAvailabilityHotel(hotelId){
  var q = "SELECT kat.kat,belegung.datum, belegung.katnr, belegung.anzahl \
          FROM protel.proteluser.belegung \
          LEFT OUTER JOIN protel.proteluser.kat ON (belegung.katnr = kat.katnr) \
          WHERE  belegung.mpehotel = "+hotelId+" and belegung.datum>dateadd(day, -1, getdate()) and belegung.anzahl!=0 \
          order by datum" ;

  executeStatementMSSQL(q, function(e, rowCount, rows){
    if (e){
      console.log("Can't write to file: ERROR WITH DATABASE");
    }
    else {
      writeResultToFile(rows);
    }
  });
}

function writeCurrentRoomAvailabilityGroup_calculated(next){
  // var hotel_ids = _.pluck(hotels, 'id');
  // console.log(hotel_ids);
  var hotels_result = {};
  async.each(
    hotel_ids,
    function(hotel_id, callback){
      CurrentRoomAvailabilityHotel_calculated(hotel_id, function(err, results){
        // console.log('#####', results);
        hotels_result[hotel_id] = results;
        callback();
      });
    },
    function(err){
      if (err){
        // Here if there was an error in retrieving hotel availability 
      }
      console.log('+++++++++++', hotels_result)
      writeResultToFile(hotels_result);
      next();
    });

  // executeStatementMSSQL(q, function(e, rowCount, rows){
  //   if (e){
  //     console.log("Can't write to file: ERROR WITH DATABASE");
  //   }
  //   else {
  //     makeAvailabilityCalculations(rows, function(results){
  //       writeResultToFile(results);
  //       next();
  //     });
  //   }
  // });
}

function writeCurrentRoomAvailabilityHotel_calculated(hotelId, next){
  var q = "SELECT kat.kat,belegung.datum, belegung.katnr, belegung.anzahl \
          FROM protel.proteluser.belegung \
          LEFT OUTER JOIN protel.proteluser.kat ON (belegung.katnr = kat.katnr) \
          WHERE  belegung.mpehotel = "+hotelId+" and belegung.datum>dateadd(day, -1, getdate()) and belegung.anzahl!=0 \
          order by datum" ;

  executeStatementMSSQL(q, function(e, rowCount, rows){
    if (e){
      console.log("Can't write to file: ERROR WITH DATABASE");
    }
    else {
      makeAvailabilityCalculations(rows, function(results){
        writeResultToFile(results);
        next();
      });
    }
  });
}

function CurrentRoomAvailabilityHotel_calculated(hotelId, callback){


  var q = "SELECT kat.kat,belegung.datum, belegung.katnr, belegung.anzahl \
          FROM protel.proteluser.belegung \
          LEFT OUTER JOIN protel.proteluser.kat ON (belegung.katnr = kat.katnr) \
          WHERE  belegung.mpehotel = "+hotelId+" and belegung.datum>dateadd(day, -1, getdate()) and belegung.anzahl!=0 \
          order by datum" ;

  console.log('###',hotelId,'---',q);

  executeStatementMSSQL(q, function(e, rowCount, rows){
    if (e){
      console.log("Can't write to file: ERROR WITH DATABASE");
    }
    else {
      makeAvailabilityCalculations(rows, function(results){
        callback(null, results);
      });
    }
  });
}

function makeAvailabilityCalculations(rows, callback){
  // console.log('************************');
  // console.log('************************');
  // console.log('************************');
  // console.log('************************');
  // console.log(rows);
  var overall_avail = {};
  for (var i=0 ; i<rows.length ; i++){
    var row = rows[i];
    var date = moment(row['datum']['value']).format('DD/MM/YYYY');
    // console.log('Date:',date);
    if (overall_avail[date] == undefined){
      overall_avail[date] = {};
      overall_avail[date].rooms = {};
      overall_avail[date].sum = 0;
      overall_avail[date].revcal = 0;
    }

    if (row['katnr']['value'] > 0){
      overall_avail[date].rooms[row['kat']['value']] = row['anzahl']['value'];
      overall_avail[date].sum = overall_avail[date].sum + row['anzahl']['value'];
      overall_avail[date].revcal = overall_avail[date].revcal + row['anzahl']['value'];
    }
    else if (row['katnr']['value'] == -202){
      overall_avail[date].provisional = row['anzahl']['value'];
      overall_avail[date].revcal = overall_avail[date].revcal - (row['anzahl']['value'])/2;
    }

    // console.log('sum=',parseInt(overall_avail[date].sum, 10));
    // console.log('prov=',parseInt(overall_avail[date].provisional, 10));


    // console.log('Overall: ',overall_avail[date]);
  }

  // console.log('OVERALL####:',overall_avail);

  callback(overall_avail);
  // return overall_avail;
}

function parseAvailabilityResults(){

}

function writeResultToFile(object){
  console.log('[writeResultToFile]: Writing results to file ("'+protelFile+'")');
  var jsonObject = JSON.stringify(object);
  fs.writeFileSync(protelFile, jsonObject);
}

function getObjectFromFile(filename, callback){
  var object = mrjson.fileToObj(filename);
  // console.log(object);
  callback(null, object);
}

function getAndUpdateObjectWithDates(filename, callback){
  getObjectFromFile(filename, function(err, object){
    for (var d in object){
      var date = moment(d, 'DD/MM/YYYY');
      object[d].date = date;
    }
    callback(err, object);
  });
}

function getAvailabilityCal(next){
  getObjectFromFile(protelFile, function(err, object){
    for (var h in object ){
      for (var d in object[h]){
        var date = moment(d, 'DD/MM/YYYY');
        object[h][d].date = date;
      }  
    }
    console.log('HOTEL PRINT:', object,':HOTEL PRINT');
    availabilityCal = object;
    // next();
  });

  next();
}

// function getCurrentMonth(callback){ 
//   var date = moment();
//   var month = date.month();
//   var monthStart = moment(date).startOf('month');
//   var monthEnd = moment(date).endOf('month');
//   console.log('-----',date.format(),'||',monthStart.format(),'-',monthEnd.format());
//   var range = moment.range(monthStart, monthEnd);

//   var monthResponse = [];

//   range.by('days', function(day){
//     var dd = day.format('ddd MMM DD YYYY')+' 03:00:00 GMT+0300 (EEST)';
//     if (availabilityCal[dd])
//       monthResponse.push(availabilityCal[dd]);
//   });
//   console.log(date.format('MMM'));
//   callback(null, monthResponse);
// }


function getCurrentMonth(callback){ 
  var date = moment();
  var month = date.month();
  getPriceCalculations(date, function(err, results){
    callback(null, results);
  });
}

function getCurrentMonthGroup(callback){ 
  var date = moment();
  var month = date.month();
  getPriceCalculationsGroup(date, function(err, results){
    console.log('------we are here ----');
    callback(null, results);
  });
}

function getMonth(month, callback){ 
  var date = moment(month, 'DD/MM/YYYY');
  // var month = date.month();
  var monthStart = moment(date).startOf('month');
  var monthEnd = moment(date).endOf('month');
  console.log('-----',date.format(),'||',monthStart.format(),'-',monthEnd.format());
  var range = moment.range(monthStart, monthEnd);

  var monthResponse = [];

  range.by('days', function(day){
    var dd = day.format('DD/MM/YYYY');
    if (availabilityCal[dd])
      monthResponse.push(availabilityCal[dd]);
  });
  console.log(date.format('MMM'));
  callback(null, monthResponse);
}

function getHotelMonth(hotel_id, month, callback){ 
  var date = moment(month, 'YYYY-MM-DDTHH:mm:ss+03:00');
  console.log('++++++', date);
  // var month = date.month();
  var monthStart = moment(date).startOf('month');
  var monthEnd = moment(date).endOf('month');
  // console.log('-----',date.format(),'||',monthStart.format(),'-',monthEnd.format());
  var range = moment.range(monthStart, monthEnd);

  var monthResponse = [];

  range.by('days', function(day){
    var dd = day.format('DD/MM/YYYY');
    // console.log('))))))))))))))))(((((((((((((((',dd, 'id:', hotel_id);
    if (availabilityCal[hotel_id][dd])
      monthResponse.push(availabilityCal[hotel_id][dd]);
  });
  // console.log(date.format('MMM'));
  // console.log('----',availabilityCal[hotel_id],'----');
  callback(null, monthResponse);
}

function getPriceCalculations(month, callback){

  var hotel = _.find(hotels, function (hotel){
    return hotel['id'] === "1";
  });
  var hotelRatio = hotel["month_ratio"];
  var ranges = [];

  for ( var r in hotelRatio){
    var min = parseInt(hotelRatio[r]["ratiomin"],10);
    var max = parseInt(hotelRatio[r]["ratiomax"],10);
    ranges.push([
      _.range(
        parseInt(hotelRatio[r]["ratiomin"],10),
        parseInt(hotelRatio[r]["ratiomax"],10)+1
      ),
      hotelRatio[r]["price"]
    ]);
  }

  getMonth(month, function(err, results){
    var overbook;
    for (var d in results) {
      overbook = true;
      for ( var r =0 ;r<ranges.length; r++) {
        if (_.indexOf(ranges[r][0], parseInt(results[d]["revcal"])) >= 0){
          results[d]["price"] = ranges[r][1];
          _.where()

          // Compare with Official Prices
          // if (ranges[r][1] < )

          // console.log('indexOf:',d,r);
          overbook = false;
          break;
        }
      }
      if (overbook) {
        results[d]["overbooked"] = true;
        results[d]["price"] = ranges[ranges.length-1][1];
      }
    }
    callback(null, results);
  });
}

function getPriceCalculationsGroup(month, callback){
  var date = moment(month, 'YYYY-MM-DDTHH:mm:ss+03:00');
  var m = date.month()+1;
  
  var temp_results = {};
  async.each(
    hotel_ids,
    function(hotel_id,cb){
      var hotel = _.find(hotels, function (hotel){
        return hotel['id'] === hotel_id;
      });
      console.log('Hotel IDs :', hotel_ids, '---', hotel_id);
      var hotelRatio = hotel["month_ratio"][m];
      var hotelRemarks = hotel["remarks"][m];
      console.log('Hotel Ratio :', hotelRatio);
      var ranges = [];

      for ( var r in hotelRatio){
        var min = parseInt(hotelRatio[r]["ratiomin"],10);
        var max = parseInt(hotelRatio[r]["ratiomax"],10);
        ranges.push([
          _.range(
            parseInt(hotelRatio[r]["ratiomin"],10),
            parseInt(hotelRatio[r]["ratiomax"],10)+1
            ),
          hotelRatio[r]["price"]
        ]);
      }
      
      // console.log('RANGES:', ranges,'-- MONTH:', m);

      getHotelMonth(hotel_id, month, function(err, results){
        var overbook;
        console.log('GETTTTTTTMonth',results);
        for (var d in results) {
          overbook = true;
          for ( var r =0 ;r<ranges.length; r++) {
            if (_.indexOf(ranges[r][0], parseInt(results[d]["revcal"])) >= 0){
              // results[d]["price"] = "333";
              updateRoomPrices(hotel_id, m, ranges[r][1], function(er, prices){
                results[d]["price"] =  prices; 
              });
              // console.log('indexOf:',d,r);
              overbook = false;
              break;
            }
          }
          if (overbook) {
            results[d]["overbooked"] = true;
            results[d]["price"] = "30";
            updateRoomPrices(hotel_id, m, ranges[ranges.length-1][1],function(er, prices){
              results[d]["price"] =  prices;
            });
          }
        }
        console.log('Month',results);
        temp_results[hotel_id] = results;
        cb();
      });
    },
    function(error){
      if (error){
      // Do something here if error
      }
      console.log('Group CAL');
      callback(null, temp_results);
    }
  );
}

function updateRoomPrices(hotel_id, month, startPrice, callback){
  var rooms = ['DBL'];
  // startPrice = parseInt(startPrice);
  // console.log('*********:',hotel_id,'$$$$$',month, ']]]]', hotels);

  // var trueRooms = getTrueRooms(hotels[hotel_id]['rooms']);
  var hotel = _.findWhere(hotels,{'id':hotel_id});
  var prices = {};

  prices['SINGL'] = {};
  prices['SINGL']['price'] = startPrice;
  var temp_off_price_singl = _.findWhere(hotel['off_prices'][month], {"type": 'SINGL'});
  if (temp_off_price_singl)
    prices['SINGL']['compare'] = compareCalcWithOfficialPrices(prices['SINGL']['price'], temp_off_price_singl['price']);
  else
    prices['SINGL']['compare'] = "noofficial";
  for ( var rm in hotel["remarks"]["general"]){
    prices[rm] = {};
    var temp_off_price = _.findWhere(hotel['off_prices'][month], {"type": rm});
    prices[rm]['price'] = parseInt(startPrice) + parseInt(hotel["remarks"]["general"][rm]);
    if (temp_off_price)
      prices[rm]['compare'] = compareCalcWithOfficialPrices(prices[rm]['price'], temp_off_price['price']);
    else
      prices[rm]['compare'] = "noofficial";
  }

  async.each(
    rooms,
    function(room, callback){
      var rule = _.findWhere(hotel["remarks"][month], {"type":room, "price":startPrice});
      if(rule){
        prices[room]['price'] = parseInt(startPrice) + parseInt(rule['diff']);
        var temp_off_price = _.findWhere(hotel['off_prices'][month], {"type": room});
        if (temp_off_price)
          prices[room]['compare'] = compareCalcWithOfficialPrices(prices[room]['price'], temp_off_price['price']);
        else
          prices[room]['compare'] = "noofficial";        
      }
      callback();
    },
    function(error){
      if (error){
        // Run if error 
        console.log('ERROR:', error);
      }
      console.log('PRICES', prices);
      callback(results, prices);
      // return prices;
    }
  );
}

function compareCalcWithOfficialPrices(calculated, official){
  if (calculated == official)
    return "eq";
  else if (calculated < official)
    return "less";
  else
    return "more";
}

function updateWithPrices(hotel_id, month){

}

function getTrueRooms(hotelRoomList){
  return _.where(hotelRoomList, {"status" : true});
}

function getRooms(){
  var hotel = _.find(hotels, function (hotel){
    return hotel['id'] === "1";
  });

  var h = _.where(hotel['rooms'], {"status" : true});
  // console.log(h);

  return h;
}

async.series([
  getHotelInfoFromConfig,
  // getHotelIDsFromFile,
//   // getHotelRooms,
//   // writeCurrentRoomAvailability_calculated,
  // writeCurrentRoomAvailabilityHotel_calculated,
  writeCurrentRoomAvailabilityGroup_calculated,
  getAvailabilityCal
]);

// exports.getRoomAvailability = getRoomAvailability;
// exports.writeCurrentRoomAvailability = writeCurrentRoomAvailability;
// exports.writeCurrentRoomAvailability_calculated = writeCurrentRoomAvailability_calculated;
exports.getObjectFromFile = getObjectFromFile;
// exports.getAndUpdateObjectWithDates = getAndUpdateObjectWithDates;
// exports.getMonth = getMonth;
exports.getCurrentMonthGroup = getCurrentMonthGroup;
exports.getHotelInfo = getHotelInfo;
exports.getRooms = getRooms;
exports.getPriceCalculationsGroup = getPriceCalculationsGroup;
// exports.getPriceCalculations = getPriceCalculations;
exports.writeCurrentRoomAvailabilityGroup_calculated = writeCurrentRoomAvailabilityGroup_calculated