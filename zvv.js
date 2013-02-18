  var colortable = new Object();
  colortable[2] = '#D8232A';
  colortable[3] = '#009F4A';
  colortable[4] = '#3E4085';
  colortable[5] = '#855B37';
  colortable[6] = '#DA9F4F';
  colortable[7] = '#191919';
  colortable[8] = '#86CD16';
  colortable[9] = '#3E4085';
  colortable[10] = '#DA3987';
  colortable[11] = '#009F4A';
  colortable[12] = '#7ACAD4';
  colortable[13] = '#FBD01F';
  colortable[14] = '#00A4DB';
  colortable[15] = '#D8232A';
  colortable[17] = '#CD6090';
  
  
  colortable[31] = '#98A2D1';
  colortable[32] = '#D6ADD6';
  colortable[33] = '#E4E19E';
  colortable[34] = '#FFFFFF';
  colortable[46] = '#B9D8A3';
  colortable[72] = '#D9AB9F';
  
  
  var textcolortable = new Object();
  textcolortable[2] = 'white';
  textcolortable[3] = 'white';
  textcolortable[4] = 'white';
  textcolortable[5] = 'white';
  textcolortable[6] = 'white';
  textcolortable[7] = 'white';
  textcolortable[8] = 'black';
  textcolortable[9] = 'white';
  textcolortable[10] = 'white';
  textcolortable[11] = 'white';
  textcolortable[12] = 'black';
  textcolortable[13]= 'black';
  textcolortable[14] = 'white';
  textcolortable[15] = 'white';
  textcolortable[17] = 'white';
  
  textcolortable[31] = 'white';
  textcolortable[32] = 'black';
  textcolortable[33] = 'black';
  textcolortable[34] = 'black';
  textcolortable[46] = 'black';
  textcolortable[72] = 'black';


var journeyids = new Array;
var updatedjourneyids = new Array;
var maxjourneys = 9;

function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    );
}




var ibnr = getURLParameter('ibnr');

if (ibnr == "null" ) {
      ibnr = "8591123";
    }


$.get("http://fahrplan.mueslo.de/proxy/bin/stboard.exe/dn?L=vs_stbzvv",
{
  input: ibnr,
  boardType: "dep",
  productsFilter: "1:0000001011111111",
  maxJourneys: maxjourneys,
  start: "yes",
  requestType: "0",
},
function(data) {
  eval(data);
  $("#station").text(journeysObj.stationName);
  var showStation = function(){ $('#station').removeClass('station-new'); };
  setTimeout(showStation, 100);
  var showTime = function(){ $('#time').removeClass('time-new'); };
  setTimeout(showTime, 100);

  $.each(journeysObj.journey.slice(0, maxjourneys),function(key,val) {
    $('<div/>', { id: val.id, class:'row'}).appendTo('#body');

    if (typeof colortable[val.pr] === "undefined" ) {
      var canvasColor = '#FFFFFF';
    }
    else {
      var canvasColor = colortable[val.pr];
    }
    if (typeof textcolortable[val.pr] === "undefined" ) {
      var canvasTextColor = 'black';
    }
    else {
      var canvasTextColor = textcolortable[val.pr];
    }

    $('<div/>', {class:'line_number'}).appendTo('#' + val.id).css('background-color', canvasColor).css('color', canvasTextColor).html(val.pr);
    
    if(val.rt.dlm > 0){
      $('<div/>', { class:'countdownCell', html:val.countdown + ' +' + val.rt.dlm }).appendTo('#' + val.id);
    }
    else {

      if (val.countdown_val >= 90) {
        $('<div/>', { class:'countdownCell', html:val.ti}).appendTo('#' + val.id);
      }
      else {
        $('<div/>', { class:'countdownCell', html:val.countdown}).appendTo('#' + val.id);
      }

      
    }

    $('<div/>', { class:'destinationCell', text:val.st}).appendTo('#' + val.id);

    journeyids.push(val.id);
  });
});


$(document).ready(function(){

  setInterval(function(){

      $.get("http://fahrplan.mueslo.de/proxy/bin/stboard.exe/dn?L=vs_stbzvv",
      {
          input: ibnr,
          boardType: "dep",
          productsFilter: "1:0000001011111111",
          maxJourneys: maxjourneys,
          start: "yes",
          requestType: "0",


      },
      function(data) {
          eval(data);

          var newRowDelay = 500;

          $.each(journeysObj.journey.slice(0,maxjourneys) ,function(key,val) {
            if($('#' + val.id).length)
            {
              var $journeyDiv = $('#' + val.id);

              if(val.rt.dlm > 0){
                $journeyDiv.find('.countdownCell').html(val.countdown + ' +' + val.rt.dlm);
              }
              else {
                $journeyDiv.find('.countdownCell').html(val.countdown);

                if (val.countdown_val >= 90) {
                    $journeyDiv.find('.countdownCell').html(val.ti);
                  }
                  else {
                   $journeyDiv.find('.countdownCell').html(val.countdown);
                   }
              }

              $journeyDiv.data('has_updated', true);
            }
            else {
              if( $.inArray(val.id,journeyids) == -1) {
                // Build and append new DIV
                $('<div/>', { id: val.id, class:'row row-new'}).appendTo('#body');

                if (typeof colortable[val.pr] === "undefined" ) {
                  var canvasColor = '#FFFFFF';
                }
                else {
                  var canvasColor = colortable[val.pr];
                }
                if (typeof textcolortable[val.pr] === "undefined" ) {
                  var canvasTextColor = 'black';
                }
                else {
                  var canvasTextColor = textcolortable[val.pr];
                }

                $('<div/>', {class:'line_number'}).appendTo('#' + val.id).css('background-color', canvasColor).css('color', canvasTextColor).html(val.pr);

                if(val.rt.dlm > 0){
                  $('<div/>', { class:'countdownCell', html:val.countdown + ' +' + val.rt.dlm }).appendTo('#' + val.id);
                }
                else {

                  if (val.countdown_val >= 90) {
                    $('<div/>', { class:'countdownCell', html:val.ti}).appendTo('#' + val.id);
                  }
                  else {
                   $('<div/>', { class:'countdownCell', html:val.countdown}).appendTo('#' + val.id);
                   }

                }

                $('<div/>', { class:'destinationCell', text:val.st}).appendTo('#' + val.id);
                
                var showNewRow =  function(){ $('#' + val.id).removeClass('row-new'); };
                setTimeout(showNewRow, newRowDelay);
                newRowDelay += 500;

                journeyids.push(val.id);
              }
            }
          });

          updatedjourneyids = new Array;

          $.each(journeysObj.journey.slice(0,maxjourneys),function(key,val) {
            updatedjourneyids.push(val.id);
          });

          var slideUpDelay = 0;

          $.each(journeyids,function(index,val) {
            if ($.inArray(val,updatedjourneyids.slice(0,maxjourneys)) == -1) {
              var hideOldRow = function(){ $('#' + val).slideUp(500, function(){ this.remove(); }); };
              setTimeout(hideOldRow, slideUpDelay);
              delete journeyids[index];
              slideUpDelay += 500;
            }
          });
      });
  }, 5000);
});


function recalculateNumberOfConnections()
{
  maxjourneys = Math.floor(($(window).height() - $('#footer').height() - 100) / 90);
  var bodyPadding = ($(window).height() - $('#footer').height() - maxjourneys * 90) / 2;
  $('#body').css('padding', bodyPadding);
}

$(function(){
  $(window).resize(recalculateNumberOfConnections);
  recalculateNumberOfConnections();
});