UPDATE_PERIOD = 10000 // Update period of the Schedule API requests in milliseconds

Stations = new Mongo.Collection("stations");


if (Meteor.isClient) {
	// counter starts at 0
	Session.setDefault('station_name', "");
	Session.setDefault('station_ibnr', "");
	
	Meteor.subscribe("stations");

	Meteor.startup(function(){
		Template.body.helpers({
			station_name: function () {
				return Session.get('station_name');
			},
			failure: function () {
				return !Meteor.status().connected;
			}
		});

		Session.set('station_ibnr', getQueryParams(document.location.search).ibnr);

		Meteor.setInterval(function(){ 
			if (Session.get('station_ibnr'))
			{
				Meteor.call('register_for_update', Session.get('station_ibnr'));
			}
		}, UPDATE_PERIOD);

		if (Session.get('station_ibnr')) 
		{
			Meteor.call('register_for_update', Session.get('station_ibnr'), true);
		}
	});

	$(function() {
		$('.new').removeClass('new'); // Trigger all flying-in animations
	});
}

if (Meteor.isServer) {

	HAFAS_URL = "http://online.fahrplan.zvv.ch/bin/stboard.exe/dny";
	HAFASQuery = {
		dirInput: "",
		maxJourneys: 8,
		input: "", // The IBNR of the requested station, which needs to be set. E.g. 8591169
		boardType: "dep",
		start: "0", // required
		tpl: "stbResult2json" // required
	}

	registeredIBNRs = {};

	Meteor.startup(function () {
		Meteor.setInterval( updateFullSchedule, UPDATE_PERIOD);
	});

	Meteor.methods({
		register_for_update: function(ibnr, instant_update) {
			if (ibnr)
			{
				registeredIBNRs[ibnr] = Date.now();

				if (instant_update == true)
					updateStationSchedule();
			}
		}
	});

	function updateFullSchedule(){
		for (var ibnr in registeredIBNRs)
		{
			updateStationSchedule(ibnr);
		}

		registeredIBNRs = { }; // reset
	}

	function updateStationSchedule(ibnr)
	{
		HAFASQuery['input'] = ibnr;
		var response = HTTP.get(HAFAS_URL, {params: HAFASQuery}).data; // response of HAFAS parsed as JSON object

		Stations.update({ibnr: ibnr}, {$set: {hafas_data: response}}, {upsert: true});
	}
}
