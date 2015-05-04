from collections import OrderedDict
from slugify import slugify
import xlrd
import simplejson as json
import datetime as dt
import os
from openpyxl import load_workbook
import logging
from isoweek import Week


logger = logging.getLogger('excel')
hdlr = logging.FileHandler('excel.log')
formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
hdlr.setFormatter(formatter)
logger.addHandler(hdlr) 
logger.setLevel(logging.WARNING)

def make_json_from_excel(filename, output = '', sheet = 'Sheet1'):
	tot_counter = 0
	tot_row_numbers = []
	
	if not isinstance(filename, basestring):
		raise Exception('***WARNING: Filename not given of not a Sting')
		return None, None
	try:
		workbook = xlrd.open_workbook(filename)
		worksheet = workbook.sheet_by_name(sheet)
	except Exception:
		print "+"
		logger.error('Can\'t open Excel file ( '+filename+' ). [[Wrong Format or Corrupted filetype]]')
		return None, None

	try:
		start = worksheet.cell_value(1, 24)
		end = worksheet.cell_value(1, 33)
		hotel = worksheet.cell_value(1, 45)
		date = worksheet.cell_value(3, 45)
	except Exception:
		logger.error('['+filename+']: Wrong File Template Format')
		return None, None

	date = dt.datetime.strptime(date, "%d/%m/%Y %H:%M")
	# weeknum = dt.date(date[0], date[1], date[2]).isocalendar()
	weeknum = Week.withdate(date)
	date = date.timetuple()
	output_file = output+slugify(hotel+"_"+str(weeknum[0])+'{:02d}'.format(weeknum[1])+"_"+str(date[0])+'{:02d}'.format(date[1])+'{:02d}'.format(date[2]))

	t_r = 0
	curr_row = 8
	num_rows = worksheet.nrows - 10
	num_cells = worksheet.ncols - 1

	data = []
	while curr_row < num_rows:
		curr_row += 1
		row = worksheet.row(curr_row)
		curr_cell = -1

		if (t_r > 0 ):
			row = OrderedDict()
			rv = worksheet.row_values(curr_row)
			try:
				d = xlrd.xldate_as_tuple(rv[0],0)
			except Exception:
				tot_counter += 1
				tot_row_numbers.append(curr_row)
				continue

			try:
				row['date'] = str(d[0])+"/"+str(d[1])+"/"+str(d[2])
				row['arrivals'] = rv[2]
				row['s_o'] = rv[4]
				row['dpt'] = rv[5]
				row['d_use'] = rv[6]
				row['tot'] = rv[7]
				row['occ_perc'] = rv[8]
				row['nput'] = rv[9]
				row['npuc'] = rv[10]
				row['room'] = rv[12]
				row['occ_perc_2'] = rv[13]
				row['gsts'] = rv[14]
				row['npuad'] = rv[17]
				row['adlt'] = rv[19]
				row['chld'] = rv[21]
				row['chld_2'] = rv[25]
				row['guest_ratio'] = rv[27]
				row['room_rate'] = rv[28]
				row['package'] = rv[35]
				row['npu_revenue'] = rv[39]
				row['specials'] = rv[41]
				row['tot_revenue'] = rv[46]
				row['avg_rate_per_room'] = rv[48]
				row['avg_rate_per_guest'] = rv[49]
			except Exception:
				print "Error--ROW--: [",filename,"] error while collecting row data"

			try:
				data.append(row)
			except Exception:
				print "Error: [",filename,"] Appending data to list error "
		t_r += 1

	j = json.dumps(data)

	with open(output_file + '.json', 'w') as f:
		f.write(j)

	logger.info("REPORT: Total Rows -- [ "+filename+" ] -- Count: "+str(tot_counter)+" -- Rows: ")
	if output_file:
		return (output_file, weeknum)
	else:
		return ('None',weeknum)



overall = {}
overall['2012'] = []
overall['2013'] = []
overall['2014'] = []
overall['2015'] = []
for y in overall:
	year = overall[str(y)]
	for _ in range(1,53):
		year.append({ 
			'week' : _ 

		})	
	print y,':',overall[str(y)]
files_count = 0


with open("dates-test.txt", "w") as f:
	for root, dirs, files in os.walk("../data/excel"):
	    for file in files:
	        if file.endswith(".xls"):
	        	files_count += 1
	        	if not (('MSR' in file) or ('msr'  in file)):
	        		filename = os.path.join(root, file)
	        		r = make_json_from_excel(filename, '../data/json/' )
	        		print filename,'|||||',r
	        		if len(r) != 2:
	        			print "Err"

	        		output, weeknum = r
	        		f.write(filename+" converted to JSON file: \n")
	        		if output:
	        			for week in overall[str(weeknum[0])]:
	        				if week['week'] == weeknum[1]:
	        					try:
	        						week['filename'].append(output)
	        					except Exception:
	        						week['filename'] = []
	        						week['filename'].append(output)





       		
	for y in overall:		
		print y,':',overall[str(y)]

	j = json.dumps(overall)

	with open('../data/json/overall.json', 'w') as f:
		f.write(j)
