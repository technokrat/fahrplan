UPDATE_PERIOD = 10000 // Update period of the Schedule API requests in milliseconds

Stations = new Mongo.Collection("stations");
Connections = new Mongo.Collection("connections");
Status = new Mongo.Collection("status");


if (Meteor.isClient) {
	Session.setDefault('initialized', false);
	Session.setDefault('connection_count', 8);

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
			return Connections.find({ibnr: Session.get('station_ibnr')}, {limit : Session.get('connection_count')});
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


		Tracker.autorun(function(){
			Meteor.subscribe("stations", Session.get('station_ibnr'));
			Meteor.subscribe("connections", Session.get('station_ibnr'));
		});


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

		$(window).resize(function(){
			Session.set('connection_count', recalculateNumberOfConnectionsAndAdaptScreen());
		});
		
		Session.set('connection_count', recalculateNumberOfConnectionsAndAdaptScreen());
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

	// server: publish the rooms collection, minus secret info.
	Meteor.publish("stations", function (ibnr) {
	  return Stations.find({ibnr: ibnr});
	});
	// server: publish the rooms collection, minus secret info.
	Meteor.publish("connections", function (ibnr) {
	  return Connections.find({ibnr: ibnr});
	});

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
		HAFASQuery['maxJourneys'] = registeredIBNRs[ibnr].connection_count;

		var update_date = Date.now();
		var response = HTTP.get(HAFAS_URL, {params: HAFASQuery, timeout: 1000}).data; // response of HAFAS parsed as JSON object

		if (response && response.station.name)
		{
			Stations.update({ibnr: ibnr}, {$set: {hafas_raw: response, name: response.station.name}}, {upsert: true});

			for (key in response.connections)
			{
				var hash = hashConnection(ibnr, response.connections[key]);
				Connections.upsert({ibnr: ibnr, hash: hash}, {$set: {hafas_raw: response.connections[key], updated_at: update_date}});
			}

			Connections.remove({ibnr: ibnr, updated_at: {$lt: update_date}});
		}
	}

	function hashConnection(ibnr, HAFASConnection)
	{
		var message = ibnr + HAFASConnection.product.line + HAFASConnection.product.direction + HAFASConnection.mainLocation.date + HAFASConnection.mainLocation.time;
		return CryptoJS.SHA256(message).toString();
	}
}
