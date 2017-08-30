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


Template.body.onRendered(() => {
    new mondaine_clock.MondaineClock($("#clock")[0]);
    new connection_board.ConnectionBoard($("#connection_board")[0])
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
            return "Unknow Station";
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

    },
    connections: function () {
        return Connections.find({
            ibnr: Session.get('station_ibnr')
        }, {
            sort: {
                countdown: 1
            },
            limit: Session.get('connection_count')
        });
    }
});

Session.setDefault('initialized', false);
Session.setDefault('connection_count', 8);


Meteor.startup(function () {
    Meteor.subscribe('status');

    var station_ibnr = getQueryParams(document.location.search).ibnr;
    if (!station_ibnr)
        station_ibnr = "8591123";

    Session.set('station_ibnr', station_ibnr);

    $(window).resize(function () {
        Session.set('connection_count', recalculateNumberOfConnectionsAndAdaptScreen());
    });

    Meteor.setInterval(function () {
        Session.set('connection_count', recalculateNumberOfConnectionsAndAdaptScreen());
    }, 30000); // prevent Raspberry Pi from setting wrong connection_count

    Session.set('connection_count', recalculateNumberOfConnectionsAndAdaptScreen());


    Tracker.autorun(function () {
        Meteor.subscribe("stations", Session.get('station_ibnr'));
        Meteor.subscribe("connections", Session.get('station_ibnr'), function () {
            Session.set('initialized', true);
        });
    });

    Meteor.setInterval(function () {
        Meteor.call('register_for_update', Session.get('station_ibnr'), Session.get('connection_count'), function (isIBNRLegit) {
            return false;
        });
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

const recalculateNumberOfConnectionsAndAdaptScreen = () => {
    var bodyPadding;
    var maxjourneys;
    var zoom = getQueryParams(document.location.search).zoom;
    if (!zoom)
        zoom = 1;

    if ($(window).width() >= 1200) {
        maxjourneys = Math.floor(($(window).height() / zoom - $('#schedule .footer').height() / zoom - 120) / 85);
    } else if ($(window).width() < 1200 && $(window).width() >= 980) {
        maxjourneys = Math.floor(($(window).height() / zoom - $('#schedule .footer').height() / zoom - 96) / 77.75);
    } else if ($(window).width() < 980 && $(window).width() >= 768) {
        maxjourneys = Math.floor(($(window).height() / zoom - $('#schedule .footer').height() / zoom - 96) / 69.25);
    } else if ($(window).width() < 768 && $(window).width() > 480) {
        maxjourneys = Math.floor(($(window).height() / zoom - $('#schedule .footer').height() / zoom - 28) / 85);
    } else if ($(window).width() <= 480) {
        maxjourneys = Math.floor(($(window).height() / zoom - $('#schedule .footer').height() / zoom - 20) / 75);
    } else {}

    $('#schedule .body').css('padding', bodyPadding);
    $('body').css('zoom', zoom);

    return maxjourneys;
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
