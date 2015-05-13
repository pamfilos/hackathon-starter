var changedPrices = {};
var now = moment();
var currentMonth = now.month();
var currentYear = now.year();

$(document).ready(function(){
	var wid = 100/31;
	wid = wid.toString()+"%";
	var monthData;
	updateEventList();

	var availCal = $('#calendar').clndr({
		template: $('#template').html(),
		showAdjacentMonths: false,
		targets: {
			todayButton: 'clndr-today-button'
		},
		clickEvents: {
			onMonthChange: function(month){
				// alert(month);
				currentMonth = month;
				$('.calendar-clone').html($('#msr-clndr-main').contents().clone());
				// $('#msr-clndr').clone().appendTo('.calendar-clone');
				$('.ajaxloader').show();
				var data = {
					month : month.format()
				};

				$.get(
					'/msr/month', 
					data,
					function(data){
						var response = $(data);
						// console.log(response);
						response.each(function(i,el){
							var elid = $(el).attr("id");
							console.log(elid);
							$('#'+elid).html($(el).html());
						});
						updateEventList();
						$('.ajaxloader').hide();
					}
				);
			}
		}
	});

	$('.calendar-clone').html($('#msr-clndr-main').contents().clone());
	$('.box').css('width',wid);
});

$('.toggle-tabs-button').click(function(e){
	var p_el_id = $(e.target).parent().parent().attr('id');
	$('#'+p_el_id+' li:not(.active) a').tab('show');
});


$('[id^= update-button]').click(function(){
	// console.log('llllLLLLLLL'+$(this).attr('id'));
	var hotel_id = $(this).attr('id').split('-');
	hotel_id = hotel_id[hotel_id.length -1];
	console.log('HOTEL: '+hotel_id);
	var html = "";
	if ((changedPrices[hotel_id] != undefined) && (changedPrices[hotel_id].length != 0)){

		html += '<ul class="changed-prices">';
		html += '<li class="header"><div>Date</div><div>Room</div><div>From (price)</div><div>To (price)</div></li>'
		for (p in changedPrices[hotel_id]){
			html += '<li>';
			html += '<div>'+changedPrices[hotel_id][p].date+'</div>';
			html += '<div>'+changedPrices[hotel_id][p].roomtype+'</div>';
			html += '<div>'+changedPrices[hotel_id][p].price_from+'</div>';
			html += '<div>'+changedPrices[hotel_id][p].price_to+'</div>';
			html += '</li>';
		}
		html += '</ul>';
		$('#modified-prices-modal-'+hotel_id+'.modal .modal-footer .update-changes-button').prop("disabled",false);
	}
	else {
		html = '<div class="nodata">There is no data to be updated</div>';
		$('#modified-prices-modal-'+hotel_id+'.modal .modal-footer .update-changes-button').prop("disabled",true);
	}
	$('#modified-prices-modal-'+hotel_id+'.modal .modal-body').html(html);
});

function updateEventList(){
	$('.roomdateprice.box').change(function(){
		var defaultVal = $(this).prop("defaultValue");
		var currentVal = $(this).val();
		if (isNaN(currentVal)){
			$(this).addClass("invalid-input");
			return false;
		}
		else {
			$(this).removeClass("invalid-input");
		}
		var id = $(this).attr('name');
		var split = id.split('-');
		var hotel = split[1];
		if ( currentVal != defaultVal) {
			$(this).addClass('changed');
			// console.log('Changed:',$(this).attr('name'));
			console.log('==== ',hotel);
			var date = split[split.length -1];
			var roomtype = split[split.length -2];
			if (changedPrices[hotel] == undefined){
				changedPrices[hotel] = [];
			}
			changedPrices[hotel] = _.reject(changedPrices[hotel], function(el){
				return el["id"] == id;
			});
			changedPrices[hotel].push({
				"id": id, 
				"date": date,
				"roomtype": roomtype,
				"price_from": defaultVal,
				"price_to": currentVal
			});
		} 
		else {
			$(this).removeClass('changed');
			changedPrices[hotel] = _.reject(changedPrices[hotel], function(el){
				return el["id"] == id;
			});
		}
	});	
}

function updateCalendar(monthData) {
	console.log(data);
	for (var d in data){
		var date = '.calendar-day-'+data[d].date.split("T")[0]+' .day-content';
		var date = $(date);
		// date.html(JSON.stringify(data[d]));
	}
}

var nowTemp = new Date();
var tmp = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate(), 0, 0, 0, 0);


$('[id^= add-event-modal] .event-date-field-from').datepicker({
	'format': 'dd/mm/yyyy',
	'autoclose': true,
	'calendar-weeks': true,
	'startView': 'year',
	'startDate': tmp
}).on('changeDate', function(selected){
	startDate = new Date(selected.date.valueOf());
	startDate.setDate(startDate.getDate(new Date(selected.date.valueOf())));
	$('[id^= add-event-modal] .event-date-field-to').datepicker('setStartDate', startDate);
}); 

$('[id^= add-event-modal] .event-date-field-to').datepicker({
	'format': 'dd/mm/yyyy',
	'autoclose': true,
	'calendar-weeks': true,
	'startView': 'year'
}).on('changeDate', function(selected){
	FromEndDate = new Date(selected.date.valueOf());
	FromEndDate.setDate(FromEndDate.getDate(new Date(selected.date.valueOf())));
	$('[id^= add-event-modal] .event-date-field-from').datepicker('setEndDate', FromEndDate);
});




// var eventDateFrom = $('[id^= add-event-modal] .event-date-input').datepicker({
// 	'format': 'dd/mm/yyyy',
// 	'autoclose': true,
// 	'calendar-weeks': true,
// 	'startView': 'year'
// 	// onRender: function(date) {
// 	// 	return date.valueOf() < now.valueOf() ? 'disabled' : '';
// 	// }
// }).on('changeDate', function(ev) {
// 	// if (ev.date.valueOf() > eventDateTo.date.valueOf()) {
// 	// 	var newDate = new Date(ev.date)
// 	// 	newDate.setDate(newDate.getDate() + 1);
// 	// 	eventDateTo.setValue(newDate);
// 	// }
// 	// eventDateFrom.hide();
// 	// $('#booking-date-field-to')[0].focus();
// }).data('datepicker');


// var eventDateTo = $('[id^= add-event-modal] .event-date-field-to').datepicker({
// 	'format': 'dd/mm/yyyy',
// 	'autoclose': true,
// 	onRender: function(date) {
// 		return date.valueOf() <= eventDateFrom.date.valueOf() ? 'disabled' : '';
// 	}
// }).on('changeDate', function(ev) {
// 	eventDateTo.hide();
// }).data('datepicker');


// Styles checkboxes in "Add event" form
$('.event-hotels').buttonset();

// Actions to take when submiting the "Add Event" form
$('.add-event-button').click(function(){
	var modal = $(this).closest('.add-event-modal');
	var form = modal.find('.add-event-form');
	var split = modal.attr('id').split('-');
	var hotel_id = split[split.length-1];

	var data = form.serializeJSON();

	var from = data["event-date-field-from"];
	from = moment(from[0].value, 'DD/MM/YYYY');
	var to = data["event-date-field-to"];
	to = moment(to[0].value, 'DD/MM/YYYY');
	var currentMonthStart = moment([currentYear, currentMonth]);
	var currentMonthEnd = moment(currentMonthStart).endOf('month');
	var currentMonthRange = moment.range(currentMonthStart, currentMonthEnd);
	var eventRange = moment.range(from, to);
	var daysInCurrentMonth = currentMonthRange.intersect(eventRange);
	$.post('/events/add', data, function(){
		modal.modal('hide');
	});

	if (daysInCurrentMonth){
		daysInCurrentMonth.by('days', function(day) {
		  $('#event-'+hotel_id+'-'+day.format('DDMMYYYY')).removeClass('NaN').addClass('event');
		});
	}
});

