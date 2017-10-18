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
        if (evt.keyCode == 13) {
            Meteor.call('register_for_update', evt.currentTarget.value, Session.get('connection_count'), true, (error, result) => {
                if (result)

                {
                    Session.set("station_ibnr", evt.currentTarget.value);
                    localStorage.setItem("station_ibnr", evt.currentTarget.value);
                }

            });



        } else {
            Session.set("search-query", evt.currentTarget.value);
        }

    },
})

Template.search.onRendered(() => {
    Session.set("search-query", "");
    $("#search-query").focus();
});

Template.availablestations.helpers({
    searchResults: function () {
        var keyword = Session.get("search-query");
        var query = new RegExp(keyword, 'i');

        if (keyword && keyword.length > 0) {

            var results = AvailableStations.find({
                $or: [{
                        'name': query
                },
                    {
                        'ibnr': query
                }]
            }, {
                limit: 20
            });
            return {
                results: results
            };
        }
    }
});


Template.station_entry.events({
    'click .station-entry': function (event) {
        event.preventDefault();

        Meteor.call('register_for_update', this.ibnr, Session.get('connection_count'), true, (error, result) => {
            if (result)

            {
                Session.set("station_ibnr", this.ibnr);
                localStorage.setItem("station_ibnr", this.ibnr);
            }

        });
    }
});




Template.body.onRendered(() => {
    $("#window").removeClass("new");
    $(document).on('keydown', (e) => {
        if (e.keyCode == 27)
            Session.set("route", "");
        else
            Session.set("route", "overlay");
    });

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

Template.body.events({
    // Fires when any element is clicked
    'click #schedule' (event) {
        Session.set("route", "overlay");
    },
    // Fires when any element is clicked
    'click #overlay .close' (event) {
        event.preventDefault();
        Session.set("route", "");
    }
});

Template.overlay.helpers({
    failure: function () {
        let status = Status.findOne({
            status: "lastHAFASOnline"
        });

        if (!Meteor.status().connected)
            return "Bad connection to webserver";
        else if (status && status.date && (status.date <= (Date.now() - 60000)))
            return "No updates from HAFAS!";
        else if (stationSubscription.ready() && !Stations.findOne({
                ibnr: Session.get('station_ibnr')
            }))
            return "IBNR does not exist"
        else
            return false;

    }
});

Template.overlay.onRendered(() => {
    $('#overlay').removeClass("new");
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
            return "";
    },

    isOverlay: function () {
        if (Session.get("route") === "overlay") {
            return true;
        }

        let status = Status.findOne({
            status: "lastHAFASOnline"
        });

        if (!Meteor.status().connected)
            return true;
        else if (status && status.date && (status.date <= (Date.now() - 60000)))
            return true;
        else if (stationSubscription.ready() && !Stations.findOne({
                ibnr: Session.get('station_ibnr')
            }))
            return true;
        else
            return false;
    }
});


Session.setDefault('connection_count', 16);

let stationSubscription;

Template.body.onCreated(function () {

    Meteor.subscribe('status');
    Meteor.subscribe('availablestations');

    var station_ibnr = getQueryParams(document.location.search).ibnr;
    if (!station_ibnr)
        station_ibnr = localStorage.getItem("station_ibnr");
    if (!station_ibnr)
        station_ibnr = "8591123";

    Session.set('station_ibnr', station_ibnr);
    localStorage.setItem("station_ibnr", station_ibnr);

    Tracker.autorun(function () {
        stationSubscription = Meteor.subscribe("stations", Session.get('station_ibnr'), Session.get('connection_count'));
        Meteor.subscribe("connections", Session.get('station_ibnr'), Session.get('connection_count'));
        Meteor.setInterval(function () {
            Meteor.call('register_for_update', Session.get('station_ibnr'), Session.get('connection_count'), false);
        }, UPDATE_PERIOD);
    });

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
