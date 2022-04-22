import { Template } from 'meteor/templating'

import './connection.html'

Template.connection.helpers({
  is_long_line: function (number) {
    if (number.length > 2) return true
    else return false
  },
  is_scheduled_countdown_near: function (countdown) {
    if (parseInt(countdown) < 60) return true
    else return false
  },
  is_bg_black: function (color) {
    if (color == '000000') return true
    else return false
  },
})

Template.connection.onRendered(function () {
  Meteor.setTimeout(function () {
    $('.new').removeClass('new')
  }, 200)
})
