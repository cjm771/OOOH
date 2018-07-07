/*
* ExchangeHelper
*
* Copyright 2018, Chris Malcolm
* http://chris-malcolm.com/
*
* Licensed under the MIT license:
* http://www.opensource.org/licenses/MIT
*
*
*  Helper to query exchange server
*
*/
var util = require('util');
var fs = require('fs');
var ews = require('ews-javascript-api');
var moment = require('moment');
ews.EwsLogging.DebugLogEnabled = false;


var ExchangeHelper = {
	service: false,
	// keywords: ['ooo','pto','vacation','wfh'],
	settings: {}, //edit config.json or hard code it in here.
	appointments: [],
	timeout: 2000,
	getAppointments: function(start, end, res) {
		let that = this;
		//dude lets talk calendars
		var view = new ews.CalendarView(ews.DateTime.Parse(Date.parse(start)), ews.DateTime.Parse(Date.parse(end))); // appointments in last one week.
		var calendarId = new ews.FolderId(ews.WellKnownFolderName.Calendar,new ews.Mailbox(that.settings.calendar_email));
		return this.service.FindAppointments(calendarId, view).then((response) => {
			that.appointments = response.Items.map(function(item){
				return {
					'subject': item.Subject, 
					'start': new Date(Date.parse(item.Start.toString())),
					'end':  new Date(Date.parse(item.End.toString()))
				}
			});
			res.send(that.successJSON(that.reformatData(that.filterAppointments(that.appointments))));	

		}, function (error) {
		  	res.send(that.errorJSON(error.message));
		});

	},
	successJSON: function(data) {
		return {
			status: 'success',
			content: data
		}
	},
	errorJSON: function(msg) {
		return {
			status: 'error',
			message: msg
		}
	},
	getMonthAndDayStr: function(date) {
		return moment(date).format('MMM DD'); 
	},
	getDayStr: function(date) {
		return moment(date).format('DD'); 
	},
	getShortMonthNameStr: function(date){
		return moment(date).format('MMM');
	},
	getMonthNameStr: function(date){
		return moment(date).format('MMMM');
	},
	getMonthStr: function(date) {
		return moment(date).format('MM'); 
	},
	determineSharedDatePortions: function(date1, date2) {
		if (date1.getMonth() === date2.getMonth()) {
			if (date1.getDate() === date2.getDate()) {
				return 'sameDay';
			} else {
				return 'sameMonth';
			}
		} else {
			return 'none';
		}
		//return same day, month
	},
	getUpdatedList: function(existingList, momentDate, obj) {
		let newDataStructure = existingList;
		//create month container if it doesnt exitst
		let currDate = momentDate.toDate();
		let key = currDate.getFullYear() + this.getMonthStr(currDate)
		newDataStructure[key] = newDataStructure[key] || {
			name: this.getMonthNameStr(currDate),
			items: {}
		};

		let dateKey = this.getDayStr(currDate);
		//create name
		newDataStructure[key].items[dateKey] = newDataStructure[key].items[dateKey] || [];
		newDataStructure[key].items[dateKey].push(obj);
		return newDataStructure;
	},
	getInbetweenMonths: function(date1, date2) {
		var startDate = moment(date1);
		var endDate = moment(date2);

		var result = [];
		var currentDate = startDate.clone();

		let first = true;
		while (startDate.isBefore(endDate)) {
			//handle first entry
			if (first === true  ){
				first = false;
				result.push({
						date: currentDate,
						description: this.getMonthAndDayStr(currentDate) + ' - ' + 'E.O. Month'
					});
			}else {
				result.push({
						date: currentDate,
						description: "All of "+this.getMonthNameStr(currentDate)
					});
			}
		    
		    startDate.add(1, 'month');
		}
		//handle last entry
		let lastEntry = this.getShortMonthNameStr(endDate) + ' 01';
		if (this.getMonthAndDayStr(endDate).trim() !== lastEntry.trim()) {
			lastEntry +=  ' - ' + this.getMonthAndDayStr(endDate);
		}
		result.push({
			date: endDate.date(1),
			description: lastEntry
		});
		return result;
	},
	reformatData: function(appts) {
		let newDataStructure = {};
		let tmpAppt, tmpMonth, tmpName, tmpDateStr, tmpType, sharedDateInfo;
		let tmpDateStrArr = [];
		for (let i = 0; i < appts.length; i++) {
			tmpDateStrArr = [];
			tmpAppt = appts[i];
			tmpMonth  = this.getMonthNameStr(tmpAppt.start);
			tmpName = tmpAppt.subject.split(/\s|-/)[0]; //name has to be start of thing.
			tmpType = this.settings.keywords.slice(0).filter( (item) => {
				return (tmpAppt.subject.toLowerCase().indexOf(item) !== -1);
			}).join(",");
			tmpDateStr = this.getMonthAndDayStr(tmpAppt.start);
			sharedDateInfo  = this.determineSharedDatePortions(tmpAppt.start, tmpAppt.end);
			if (sharedDateInfo === 'sameMonth') {
				tmpDateStr += ' - ' + this.getDayStr(tmpAppt.end);
				tmpDateStrArr.push({
					date: moment(tmpAppt.start),
					description: tmpDateStr
				});
			} else if (sharedDateInfo === 'sameDay') {
				tmpDateStrArr.push({
					date: moment(tmpAppt.start),
					description: tmpDateStr
				});
			} else if (sharedDateInfo === 'none') {
				tmpDateStr += ' - ' + this.getMonthAndDayStr(tmpAppt.end);
				//welp gotta see how many months
				tmpDateStrArr = this.getInbetweenMonths(tmpAppt.start, tmpAppt.end);

			} 

			for (let i=0; i < tmpDateStrArr.length; i++ ) {
				newDataStructure = this.getUpdatedList(newDataStructure,  tmpDateStrArr[i].date, {
					type: tmpType,
					fullDates: tmpDateStr,
					dates: tmpDateStrArr[i].description,
					name: tmpName,
					subject: tmpAppt.subject
				}) 
			}
		}
		return newDataStructure;
	},
	filterAppointments: function(appts) {
		return appts.filter((appt) => {
			
			let found = false;
			for (let i = 0; i < this.settings.keywords.length; i++) {
				if (appt.subject.toLowerCase().indexOf(this.settings.keywords[i]) !== -1) {
					found = true;
				}
			}
			return found;
		});
	},
	loadConfig: function(){
		let configSettings = {};
		let content;
		const configDir = './config';
		fs.readdirSync('./config').forEach(file => {
			if (file.indexOf('.json') !== -1) {
				content = fs.readFileSync(configDir + '/' + file, 'utf8');
				configSettings = Object.assign(configSettings, JSON.parse(content));
			}
		  
		});
		return configSettings;
	},
	init: function(email, pw) {
			this.settings = this.loadConfig();
			this.appointments = {};
			//create Autodiscoverthis.service object4
			this.service = new ews.ExchangeService(ews.ExchangeVersion.Exchange2010);
			this.service.Url = new ews.Uri(this.settings.exchange_url);
			//set credential for this.service
			if (email.trim() === "" || pw.trim()=== "") {
				return this.errorJSON("Email and password Required");
			} else {
				try {
					this.service.Credentials = new ews.ExchangeCredentials(email, pw);
					return this.successJSON(true);
				} catch (e) {
					return this.errorJSON("Error occurred when trying your credentials..." + e);
				}
			}
			
		}
}

module.exports = ExchangeHelper;