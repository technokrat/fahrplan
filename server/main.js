import {
    Meteor
} from 'meteor/meteor';


import {
    AvailableStations
} from '../imports/api/availablestations.js';

import {
    Stations
} from '../imports/api/stations.js';
import {
    Connections
} from '../imports/api/connections.js';
import {
    Status
} from '../imports/api/status.js';

import {
    UPDATE_PERIOD
} from '../imports/init/parameters.js';

import {
    ibnr_list
} from '../imports/init/ibnr_list.js';

const HAFAS_URL = "http://online.fahrplan.zvv.ch/bin/stboard.exe/dny";
const HAFASQuery = {
    dirInput: "",
    maxJourneys: 8,
    input: "", // The IBNR of the requested station, which needs to be set. E.g. 8591169
    boardType: "dep",
    start: "0", // required
    tpl: "stbResult2json" // required
};

// server: publish the rooms collection, minus secret info.
Meteor.publish("stations", function (ibnr) {
    return Stations.find({
        ibnr: ibnr
    });
});

// server: publish the rooms collection, minus secret info.
Meteor.publish("availablestations", function () {
    return AvailableStations.find();
});

// server: publish the rooms collection, minus secret info.
Meteor.publish("connections", function (ibnr) {
    return Connections.find({
        ibnr: ibnr
    });
});
Meteor.publish("status", function () {
    return Status.find();
});

registeredIBNRs = {};

Meteor.startup(function () {

    if (AvailableStations.find().count() === 0) {

        //        CSV.readCsvFileLineByLine(Assets.absoluteFilePath('DidokV30small.csv'), {
        //            headers: true,
        //            delimiter: ";",
        //        }, Meteor.bindEnvironment(function (line, index, rawParsedLine) {
        //            AvailableStations.insert({
        //                ibnr: line.ibnr,
        //                name: line.name
        //            });
        //        }));
        //    }

        _.each(ibnr_list, (value, key) => {
            AvailableStations.insert({
                ibnr: key,
                name: value
            });
        });
    }

    Stations.remove({});
    Connections.remove({});
    Status.remove({});

    Meteor.setInterval(updateFullSchedule, UPDATE_PERIOD);
});

Meteor.methods({
    register_for_update: function (ibnr, connection_count, instant_update) {
        if (ibnr) {
            if (!registeredIBNRs[ibnr])
                registeredIBNRs[ibnr] = {
                    date: Date.now(),
                    connection_count: connection_count
                };
            else if (registeredIBNRs[ibnr].connection_count < connection_count)
                registeredIBNRs[ibnr] = {
                    date: Date.now(),
                    connection_count: connection_count
                };


            if (instant_update == true) {
                if (updateStationSchedule(ibnr))
                    return true;
                else
                    return false
            } else
                return false;
        } else
            return false;
    }
});

function updateFullSchedule() {
    for (var ibnr in registeredIBNRs) {
        updateStationSchedule(ibnr);
    }

    registeredIBNRs = {}; // reset
}

function updateStationSchedule(ibnr) {
    HAFASQuery['input'] = ibnr;
    HAFASQuery['maxJourneys'] = registeredIBNRs[ibnr].connection_count;

    var update_date = Date.now();

    try {
        var response = HTTP.get(HAFAS_URL, {
            params: HAFASQuery,
            timeout: 1000
        }).data; // response of HAFAS parsed as JSON object

        if (response) {
            if (response.station.name) {
                Stations.update({
                    ibnr: ibnr
                }, {
                    $set: {
                        hafas_raw: response,
                        name: response.station.name
                    }
                }, {
                    upsert: true
                });

                for (key in response.connections) {
                    var hash = hashConnection(ibnr, response.connections[key]);

                    var countdown;

                    if (response.connections[key].mainLocation.realTime.hasRealTime && response.connections[key].mainLocation.realTime.countdown !== undefined)
                        countdown = parseInt(response.connections[key].mainLocation.realTime.countdown);
                    else
                        countdown = parseInt(response.connections[key].mainLocation.countdown);

                    Connections.upsert({
                        ibnr: ibnr,
                        hash: hash
                    }, {
                        $set: {
                            hafas_raw: response.connections[key],
                            countdown: countdown,
                            updated_at: update_date
                        }
                    });
                }

                Connections.remove({
                    ibnr: ibnr,
                    updated_at: {
                        $lt: update_date
                    }
                });

                Status.upsert({
                    status: "lastHAFASOnline"
                }, {
                    $set: {
                        date: Date.now()
                    }
                });

                return true;
            } else
                return false;
        } else {
            return false;
        }
    } catch (e) {
        return false;
    }
}

function hashConnection(ibnr, HAFASConnection) {
    var message = ibnr + HAFASConnection.product.line + HAFASConnection.product.direction + HAFASConnection.mainLocation.date + HAFASConnection.mainLocation.time;
    return CryptoJS.SHA256(message).toString();
}
