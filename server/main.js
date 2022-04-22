import { Meteor } from 'meteor/meteor'

import { AvailableStations } from '../imports/api/availablestations.js'
import { Stations } from '../imports/api/stations.js'
import { Connections } from '../imports/api/connections.js'
import { Status } from '../imports/api/status.js'

import { UPDATE_PERIOD } from '../imports/init/parameters.js'

import { ibnr_list } from '../imports/init/ibnr_list.js'

const HAFAS_URL = 'http://online.fahrplan.zvv.ch/bin/stboard.exe/dny'
const HAFASQuery = {
  dirInput: '',
  maxJourneys: 8,
  input: '', // The IBNR of the requested station, which needs to be set. E.g. 8591169
  boardType: 'dep',
  start: '0', // required
  tpl: 'stbResult2json', // required
}

// server: publish the rooms collection, minus secret info.
Meteor.publish('stations', function (ibnr, count) {
  registerForUpdate(ibnr, count, true)
  return Stations.find({
    ibnr: ibnr,
  })
})

// server: publish the rooms collection, minus secret info.
Meteor.publish('availablestations', function (query) {
  if (!query) {
    return this.ready()
  }
  return AvailableStations.find(
    {
      $text: {
        $search: query,
        $diacriticSensitive: false,
      },
    },
    {
      limit: 20,
      fields: {
        score: {
          $meta: 'textScore',
        },
      },
      sort: {
        score: {
          $meta: 'textScore',
        },
      },
    }
  )
})

// server: publish the rooms collection, minus secret info.
Meteor.publish('connections', function (ibnr, count) {
  return Connections.find(
    {
      ibnr: ibnr,
    },
    {
      $limit: count,
    }
  )
})
Meteor.publish('status', function () {
  return Status.find()
})

let registeredIBNRs = {}

Meteor.startup(function () {
  if (AvailableStations.find().count() === 0) {
    _.each(ibnr_list, (value, key) => {
      AvailableStations.insert({
        ibnr: key,
        name: value,
      })
    })
  }

  Stations.remove({})
  Connections.remove({})
  Status.remove({})

  Meteor.setInterval(updateFullSchedule, UPDATE_PERIOD)
})

Meteor.methods({
  register_for_update: registerForUpdate,
})

function registerForUpdate (ibnr, connection_count, instant_update) {
  if (ibnr) {
    if (!registeredIBNRs[ibnr])
      registeredIBNRs[ibnr] = {
        date: Date.now(),
        connection_count: connection_count,
      }
    else if (registeredIBNRs[ibnr].connection_count < connection_count)
      registeredIBNRs[ibnr] = {
        date: Date.now(),
        connection_count: connection_count,
      }

    if (instant_update == true) {
      let result = updateStationSchedule(ibnr)
      if (result) {
        AvailableStations.upsert(
          {
            ibnr: ibnr,
          },
          {
            $set: {
              ibnr: ibnr,
              name: result,
            },
          }
        )
        return true
      } else {
        AvailableStations.remove({
          ibnr: ibnr,
        })
        return false
      }
    } else return false
  } else return false
}

function updateFullSchedule () {
  for (var ibnr in registeredIBNRs) {
    updateStationSchedule(ibnr)
  }

  registeredIBNRs = {} // reset
}

function updateStationSchedule (ibnr) {
  HAFASQuery['input'] = ibnr
  HAFASQuery['maxJourneys'] = registeredIBNRs[ibnr].connection_count

  var update_date = Date.now()

  try {
    var response = HTTP.get(HAFAS_URL, {
      params: HAFASQuery,
      timeout: 1000,
    }).data // response of HAFAS parsed as JSON object

    if (response) {
      if (response.station.name) {
        Stations.update(
          {
            ibnr: ibnr,
          },
          {
            $set: {
              hafas_raw: response,
              name: response.station.name,
            },
          },
          {
            upsert: true,
          }
        )

        for (key in response.connections) {
          var hash = hashConnection(ibnr, response.connections[key])

          var countdown

          if (
            response.connections[key].mainLocation.realTime.hasRealTime &&
            response.connections[key].mainLocation.realTime.countdown !==
              undefined
          )
            countdown = parseInt(
              response.connections[key].mainLocation.realTime.countdown
            )
          else
            countdown = parseInt(
              response.connections[key].mainLocation.countdown
            )

          Connections.upsert(
            {
              ibnr: ibnr,
              hash: hash,
            },
            {
              $set: {
                hafas_raw: response.connections[key],
                countdown: countdown,
                updated_at: update_date,
              },
            }
          )
        }

        Connections.remove({
          ibnr: ibnr,
          updated_at: {
            $lt: update_date,
          },
        })

        Status.upsert(
          {
            status: 'lastHAFASOnline',
          },
          {
            $set: {
              date: Date.now(),
            },
          }
        )

        return response.station.name
      } else return false
    } else {
      return false
    }
  } catch (e) {
    return false
  }
}

function hashConnection (ibnr, HAFASConnection) {
  var message =
    ibnr +
    HAFASConnection.product.line +
    HAFASConnection.product.direction +
    HAFASConnection.mainLocation.date +
    HAFASConnection.mainLocation.time
  return CryptoJS.SHA256(message).toString()
}
