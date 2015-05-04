var changedPrices = [];

$(document).ready(function(){
	var wid = 100/31;
	wid = wid.toString()+"%";
	console.log('new width ', wid);
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
				$('.calendar-clone').html($('#msr-clndr-main').contents().clone());
				// $('#msr-clndr').clone().appendTo('.calendar-clone');

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
							// console.log(elid);
							$('#'+elid).html($(el).html());
						});
						updateEventList();
						// console.log(data);
						// for (var d in data){
						// 	var date = '.calendar-day-'+data[d].date.split("T")[0]+' .day-content';
						// 	var date = $(date);
						// 	// date.html(JSON.stringify(data[d]));
						// }
						// $('#calendar-content').html(data);
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

$('#update-button-*').click(function(){

});

function updateEventList(){
	$('.roomdateprice.box').change(function(){
		var defaultVal = $(this).prop("defaultValue");
		var currentVal = $(this).val();
		if ( currentVal != defaultVal) {
			$(this).addClass('changed');
			console.log('Changed:',$(this).attr('name'));
			changedPrices.push({"id":$(this).attr('name'), "newprice":currentVal});
		}
		else{
			$(this).removeClass('changed');
			console.log('Normal:',$(this).attr('name'));
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