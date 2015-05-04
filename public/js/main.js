var getWeek = function(newdate) {
	var parts = newdate.split("/");
	var date = new Date(parseInt(parts[2], 10),
                  parseInt(parts[1], 10) - 1,
                  parseInt(parts[0], 10));
   date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                        - 3 + (week1.getDay() + 6) % 7) / 7);
}


var updateDate = function(newdate) {
	$.get('/week',{ date : newdate }, function(data){
		$("#newdata").html(data);
	}).done(function(){
    $(".datetable").DataTable();
    $(".datefile").hide();
    $(".filename-button").click(function(){
      console.log("filename-button clicked!!");
      var date = $(this).text();
      $(".datefile").hide();
      $(".datefile#"+date).show();
    });
  });
	week = getWeek(newdate);
	console.log("---"+week);
}

var updateDates = function(from, to) {
  console.log('updateDates: '+from , to);
  $.get('/weeks',{ f : from, t : to }, function(data){
    // $("#newdata").html(data);
  }).done(function(){
    $(".datetable").DataTable();
    $(".datefile").hide();
    $(".filename-button").click(function(){
      console.log("filename-button clicked!!");
      var date = $(this).text();
      $(".datefile").hide();
      $(".datefile#"+date).show();
    });
  });
  // from_week = getWeek(from);
  // to_week = getWeek(to);
  // console.log("---"+from_week,'-',to_week);
}



var from, to, from_week, to_week, day_count;
var checkin, checkout;

$(document).ready(function() {
	var nowTemp = new Date();
	var now = new Date(
		nowTemp.getFullYear(),
		nowTemp.getMonth(),
		nowTemp.getDate()
		);
	var now = nowTemp.getDate()+'/'+(nowTemp.getMonth()+1).toString()+'/'+nowTemp.getFullYear();

  // Place JavaScript code here...

  $(".week").popover();

  $("#fff").datepicker({
  	'format': 'dd/mm/yyyy',
  	'autoclose': true,
  	'calendar-weeks': true,
  	'startView': 'year'
  }).on('changeDate', function(e){
  	d = e.date.getDate()+'/'+(e.date.getMonth()+1).toString()+'/'+e.date.getFullYear();
  	if (d === now) {
  		$("#search-date-field").val("Today");
  	}
  	else{
  		$("#search-date-field").val(d);
  	}
  });

  // $(".datepicker").datepicker({
  // 	'format': 'dd/mm/yyyy',
  // 	'autoclose': true,
  // 	'calendar-weeks': true,
  // 	'startView': 'year'
  // }).on('changeDate', function(e){
  // 	d = e.date.getDate()+'/'+(e.date.getMonth()+1).toString()+'/'+e.date.getFullYear();
  // 	console.log(d);
  // 	updateDate(d);
  // });

  var nowTemp = new Date();
  var now = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate(), 0, 0, 0, 0);



  checkin = $('#booking-date-field-from').datepicker({
    'format': 'dd/mm/yyyy',
    'autoclose': true,
    'calendar-weeks': true,
    'startView': 'year',
    onRender: function(date) {
      return date.valueOf() < now.valueOf() ? 'disabled' : '';
    }
  }).on('changeDate', function(ev) {
    if (ev.date.valueOf() > checkout.date.valueOf()) {
      var newDate = new Date(ev.date)
      newDate.setDate(newDate.getDate() + 1);
      checkout.setValue(newDate);
    }
    checkin.hide();
    $('#booking-date-field-to')[0].focus();
  }).data('datepicker');


  checkout = $('#booking-date-field-to').datepicker({
    onRender: function(date) {
      return date.valueOf() <= checkin.date.valueOf() ? 'disabled' : '';
    }
  }).on('changeDate', function(ev) {
    checkout.hide();
  }).data('datepicker');
  // $(".input-daterange").datepicker({
  //   'format': 'dd/mm/yyyy',
  //   'autoclose': true,
  //   'calendar-weeks': true,
  //   'startView': 'year'
  // }).on('changeDate', function(e){
  //   d = e.date.getDate()+'/'+(e.date.getMonth()+1).toString()+'/'+e.date.getFullYear();
  //   from = $('#booking-date-field-from').val();
  //   to = $('#booking-date-field-to').val();
  //   console.log(from);
  //   from = moment(from, "DD/MM/YYYY");
  //   to = moment(to, "DD/MM/YYYY");
  //   console.log(from._i);
  //   from_week = from.week();
  //   to_week = to.week();
  //   day_count = to.diff(from, 'days');
  //   console.log('Dates',day_count,'days:',from._i+'('+from_week+')'+'-',to._i+'('+from_week+')');
  //   var text = 'Looking for <b>'+day_count+'</b> night(s) in a <b>double</b> room in <b>Alexandros Hotel</b> from the <b>'+from._i+'</b> until the <b>'+to._i+'</b>';
  //   $('#status-info-text p').html(text);
  //   // updateDates('07-15-2015', '07-15-2015');
  //   updateCalendarView(from, to, day_count);
  //   updateDates(from.format('MM-DD-YYYY'), to.format('MM-DD-YYYY'));
  // });  

  $('#hotel-autocomplete').autocomplete({
    serviceUrl: '/hotels/autocomplete',
    minChars: 3,
    deferRequestBy: 500,
    onSelect: function (suggestion) {
      var tag = '<div class="tagify-tag">'+suggestion.value+'<i class="tagify-remove fa fa-times"></i></div>';
      $('#hotels-container-btn').before(tag);
      $('#hotel-autocomplete').val('');
      $('#hotels-container-list').val($('#hotels-container-list').val()+','+suggestion.data);
    }
  });

  $('#hotels-container-btn').click(function(){
    var data = $('#hotels-container-list').val();
    $.get('/hotels/list',{ id : data, from: from.format('MM/DD/YYYY'), to: to.format('MM/DD/YYYY')}, function(hotels){
      $("#hotels-list-results").html(hotels);
    }).done(function(){

    });
  });

  $('#chris-hotels-container-btn').click(function(){
    var data = $('#hotels-container-list').val();
    $.get('/hotels/rivals',{ from: from.format('MM/DD/YYYY'), to: to.format('MM/DD/YYYY')}, function(hotels){
      $("#hotels-list-results").html(hotels);
    }).done(function(){

    });
  });

  // $('#hotels-container-btn').click(function(){
  //   var data = $('#hotels-container-list').val();
  //   console.log('Availability: ',data, from.format('MM/DD/YYYY'), to.format('MM/DD/YYYY'));
  //   $.get('/hotels/availability',{ id : '135995', from: from.format('MM/DD/YYYY'), to: to.format('MM/DD/YYYY') }, function(hotels){
  //     $("#hotels-list-results").html(hotels);
  //   }).done(function(){

  //   });
  // });

});

var updateCalendarView = function(from, to, day_count) {
  var classname = '.calendar-day-'+from.format('YYYY-MM-DD');
  $(".day").removeClass('onrange');
  for(var i =0 ; i<day_count;i++){
    var cd = '.calendar-day-'+from.format('YYYY-MM-DD');
    $(cd).addClass('onrange');
    from.add('days',1);
  }
  if ( calendar.month.get('month') != from.get('month') )
    calendar.setMonth(from.get('month'));
  console.log('updateCalendarView ::',month);
};