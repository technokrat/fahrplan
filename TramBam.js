Stations = new Mongo.Collection("stations");


if (Meteor.isClient) {
  // counter starts at 0
  Session.setDefault('station_name', "");

  Template.body.helpers({
    station_name: function () {
      return Session.get('station_name');
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });

  Meteor.methods({
    request_update: function(ibnr) {
      return;
    }
  });
}
