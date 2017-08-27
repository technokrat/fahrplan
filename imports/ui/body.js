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



import './connection.js';
import './body.html';


Template.body.onRendered(() => {
    new mondaine_clock.MondaineClock($("#clock")[0]);
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
        bodyPadding = ($(window).height() / zoom - $('#schedule .footer').height() / zoom - maxjourneys * 85) / 2;
    } else if ($(window).width() < 1200 && $(window).width() >= 980) {
        maxjourneys = Math.floor(($(window).height() / zoom - $('#schedule .footer').height() / zoom - 96) / 77.75);
        bodyPadding = ($(window).height() / zoom - $('#schedule .footer').height() / zoom - maxjourneys * 77.75) / 2;
    } else if ($(window).width() < 980 && $(window).width() >= 768) {
        maxjourneys = Math.floor(($(window).height() / zoom - $('#schedule .footer').height() / zoom - 96) / 69.25);
        bodyPadding = ($(window).height() / zoom - $('#schedule .footer').height() / zoom - maxjourneys * 69.25) / 2;
    } else if ($(window).width() < 768 && $(window).width() > 480) {
        maxjourneys = Math.floor(($(window).height() / zoom - $('#schedule .footer').height() / zoom - 28) / 85);
        bodyPadding = "";
    } else if ($(window).width() <= 480) {
        maxjourneys = Math.floor(($(window).height() / zoom - $('#schedule .footer').height() / zoom - 20) / 75);
        bodyPadding = "";
    } else {
        bodyPadding = "";
    }

    $('#schedule .body').css('padding', bodyPadding);
    $('body').css('zoom', zoom);

    return maxjourneys;
}


const updateClock = () => {
    var date = new Date();
    var timeString = formatTimeComponent(date.getHours()) + ":" + formatTimeComponent(date.getMinutes()) + ":" + formatTimeComponent(date.getSeconds());
    $('.time').text(timeString);
};

const formatTimeComponent = (value) => {
    if (value > 9) {
        return "" + value;
    } else {
        return "0" + value;
    }
};
