UPDATE_PERIOD = 10000 // Update period of the Schedule API requests in milliseconds

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

import '../helpers/time.js';
import '../helpers/helpers.js';


import './body.html';

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

    Meteor.setInterval(updateClock, 1000);
    updateClock();

    Meteor.setInterval(function () {
        Meteor.call('register_for_update', Session.get('station_ibnr'), Session.get('connection_count'), function (isIBNRLegit) {
            return false;
        });
    }, UPDATE_PERIOD);

    Meteor.call('register_for_update', Session.get('station_ibnr'), Session.get('connection_count'), true);
});
