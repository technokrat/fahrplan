import {
    Template
} from 'meteor/templating';

import {
    Session
} from 'meteor/session';

import {
    Stations
} from '../api/stations.js';

import {
    AvailableStations
} from '../api/availablestations.js';


import {
    Connections
} from '../api/connections.js';

import {
    Status
} from '../api/status.js';


import {
    Meteor
} from 'meteor/meteor';


import {
    UPDATE_PERIOD
} from '../init/parameters.js';


import mondaine_clock from '../libs/mondaine_clock.js';
import connection_board from '../libs/connection_board.js';


import './connection.js';
import './body.html';


var connectionBoard;


Template.search.events({
    'keyup input.search-query': function (evt) {
        Session.set("search-query", evt.currentTarget.value);
    },
})

Template.availablestations.helpers({
    searchResults: function () {
        var keyword = Session.get("search-query");
        var query = new RegExp(keyword, 'i');

        if (keyword.length > 0) {

            var results = AvailableStations.find({
                $or: [{
                        'name': query
            },
                    {
                        'ibnr': query
            }]
            });
            return {
                results: results
            };
        }
    }
});




Template.body.onRendered(() => {

    let resized = (count) => {
        Session.set('connection_count', count);
    }

    new mondaine_clock.MondaineClock($("#clock")[0]);
    connectionBoard = new connection_board.ConnectionBoard($("#connection_board")[0], resized);

    Tracker.autorun(() => {
        var connections = Connections.find({
            ibnr: Session.get('station_ibnr')
        }, {
            sort: {
                countdown: 1
            },
            limit: Session.get('connection_count')
        });

        connectionBoard.updateConnections(connections);
    });
});

Template.body.helpers({
    station_name: function () {
        if (Stations.findOne({
                ibnr: Session.get('station_ibnr')
            })) {
            return Stations.findOne({
                ibnr: Session.get('station_ibnr')
            }).name;
        } else
            return "Unknown Station";
    },
    failure: function () {
        if (!Session.get('initialized'))
            return false;
        else if (!Meteor.status().connected)
            return "Bad connection to webserver";
        else if (!Status.findOne({
                status: "lastHAFASOnline"
            }).date >= (Date.now() - 60000))
            return "HAFAS is probably offline";
        else if (!Stations.findOne({
                ibnr: Session.get('station_ibnr')
            }))
            return "IBNR does not exist"
        else
            return false;

    }
});

Session.setDefault('initialized', false);
Session.setDefault('connection_count', 16);


Meteor.startup(function () {
    Meteor.subscribe('status');
    Meteor.subscribe('availablestations');

    var station_ibnr = getQueryParams(document.location.search).ibnr;
    if (!station_ibnr)
        station_ibnr = "8591123";

    Session.set('station_ibnr', station_ibnr);

    Tracker.autorun(function () {
        Meteor.subscribe("stations", Session.get('station_ibnr'));
        Meteor.subscribe("connections", Session.get('station_ibnr'), function () {
            Session.set('initialized', true);
        });
        Meteor.call('register_for_update', Session.get('station_ibnr'), Session.get('connection_count'), true);
    });

    Meteor.setInterval(function () {
        Meteor.call('register_for_update', Session.get('station_ibnr'), Session.get('connection_count'), false);
    }, UPDATE_PERIOD);
    Meteor.call('register_for_update', Session.get('station_ibnr'), Session.get('connection_count'), true);

    Meteor.setInterval(updateClock, 100);
});


const getUrlParameter = (sParam) => {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
}

const getQueryParams = (qs) => {
    qs = qs.split("+").join(" ");

    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }

    return params;
}

let lastSecond;

const updateClock = () => {
    var date = new Date();
    if (lastSecond !== date.getSeconds()) {

        var timeString = date.toLocaleTimeString('de-CH');
        timeString += "<br><span style='font-size:0.9em;'>";
        var options = {
            weekday: 'short',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'

        }
        timeString += date.toLocaleDateString('de-CH', options) + "</span>";
        $('.time-digits').html(timeString);
    }
};
