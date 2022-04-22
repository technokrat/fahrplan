import { Meteor } from 'meteor/meteor'

import { Mongo } from 'meteor/mongo'

export const AvailableStations = new Mongo.Collection('availablestations')

if (Meteor.isServer) {
  AvailableStations._ensureIndex({
    name: 'text',
    ibnr: 'text',
  })
}
