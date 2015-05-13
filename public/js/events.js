$(document).ready(function(){

});

var nowTemp = new Date();
var tmp = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate(), 0, 0, 0, 0);

$('.event-hotels').buttonset();

$('[data-toggle="popover"]').popover();

$('.event-date-field-from').datepicker({
	'format': 'dd/mm/yyyy',
	'autoclose': true,
	'calendar-weeks': true,
	'startView': 'year',
	'startDate': tmp
}).on('changeDate', function(selected){
	startDate = new Date(selected.date.valueOf());
	startDate.setDate(startDate.getDate(new Date(selected.date.valueOf())));
	$('.event-date-field-to').datepicker('setStartDate', startDate);
}); 

$('.event-date-field-to').datepicker({
	'format': 'dd/mm/yyyy',
	'autoclose': true,
	'calendar-weeks': true,
	'startView': 'year'
}).on('changeDate', function(selected){
	FromEndDate = new Date(selected.date.valueOf());
	FromEndDate.setDate(FromEndDate.getDate(new Date(selected.date.valueOf())));
	$('.event-date-field-from').datepicker('setEndDate', FromEndDate);
});

$('.delete-event-modal-btn').click(function(){
	var event_id = $(this).attr('id');
	event_id = event_id.split('-')[1];
	$('#delete-event-modal [name="delete-hidden-evid"]').val(event_id);
	console.log(')_)_):',event_id);
});

$('#delete-event-modal .delete-event-btn').click(function(){
	var event_id = $('#delete-event-modal [name="delete-hidden-evid"]').val();
	var form = $('#delete-event-modal-form');
	// var delete_event = form.serializeJSON();
	var data = form.serializeJSON();
	$.post('/events/delete',
	data, 
	function(data, status){
		console.log(status);
		if (status == 'Accepted'){
			window.location.replace("/events");			
		}
		else{
			$('#delete-event-modal').modal('hide');
			$('#event-box-'+event_id).remove();			
		}
	});
})