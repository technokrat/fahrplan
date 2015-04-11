UPDATE_PERIOD = 10000 // Update period of the Schedule API requests in milliseconds

Stations = new Mongo.Collection("stations");
Connections = new Mongo.Collection("connections");
Status = new Mongo.Collection("status");


if (Meteor.isClient) {
	Session.setDefault('initialized', false);
	Session.setDefault('connection_count', 8);

	
	Meteor.subscribe("stations");
	Meteor.subscribe("connections");


	Template.body.helpers({
		station_name: function () {
			if (Stations.findOne({ibnr: Session.get('station_ibnr')}))
			{
				return Stations.findOne({ibnr: Session.get('station_ibnr')}).name;
			}
			else
				return "Unknow Station";
		},
		failure: function () {
			if (!Session.get('initialized'))
				return false;
			else if (!Meteor.status().connected)
				return "Bad connection";
			else if (!Stations.findOne({ibnr: Session.get('station_ibnr')}))
				return "IBNR does not exist"
			else
				return false;

		},
		connections: function() {
			return Connections.find({ibnr: Session.get('station_ibnr')}).fetch();
		}
	});

	Template.connection.helpers({
		is_long_line: function(number)
		{
			if (number.length > 2)
				return true;
			else
				return false;
		},
		is_scheduled_countdown_near: function(countdown)
		{
			if (parseInt(countdown) < 60)
				return true;
			else 
				return false;
		}
	});


	Meteor.startup(function(){
		var station_ibnr = getQueryParams(document.location.search).ibnr;
		if (!station_ibnr)
			station_ibnr = "8591123";

		Session.set('station_ibnr', station_ibnr);

		Meteor.setInterval(updateClock, 1000);
		updateClock();

		Meteor.setInterval(function(){ 
			if (Session.get('station_ibnr'))
			{
				Meteor.call('register_for_update', Session.get('station_ibnr'), Session.get('connection_count'));
			}
		}, UPDATE_PERIOD);

		Meteor.setTimeout(function(){
			$('.new').removeClass('new');
			Session.set('initialized', true);
		}, 1000);

		if (Session.get('station_ibnr')) 
		{
			Meteor.call('register_for_update', Session.get('station_ibnr'), Session.get('connection_count'), true);
		}
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
		register_for_update: function(ibnr, connection_count, instant_update) {
			if (ibnr)
			{
				if (!registeredIBNRs[ibnr])
					registeredIBNRs[ibnr] = {date: Date.now(), connection_count: connection_count};
				else if (registeredIBNRs[ibnr].connection_count < connection_count)
					registeredIBNRs[ibnr] = {date: Date.now(), connection_count: connection_count};


				if (instant_update == true)
					updateStationSchedule(ibnr);
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
		var response = HTTP.get(HAFAS_URL, {params: HAFASQuery, timeout: 1000}).data; // response of HAFAS parsed as JSON object

		if (response)
		{
			var HAFASParsed = parseHAFAS(response);
			if (HAFASParsed)
			{
				Stations.update({ibnr: ibnr}, {$set: {hafas_raw: response, name: HAFASParsed.station_name}}, {upsert: true});

				Connections.remove({ibnr: ibnr});

				for (connection in HAFASParsed.connections)
				{

					Connections.insert({ibnr: ibnr, hafas_raw: response.connections[connection]});
				}
			}
		}
	}

	function parseHAFAS(HAFASData)
	{
		if (HAFASData.station.name)
		{
			return  {
				station_name: HAFASData.station.name,
				connections: HAFASData.connections
			};
		}
		else
			return false;
	}

	function hashHAFASConnection(HAFASConnection)
	{
		
	}
}
