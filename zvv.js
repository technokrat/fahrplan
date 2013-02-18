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

$.get("http://fahrplan.mueslo.de/proxy/bin/stboard.exe/dn?L=vs_stbzvv",
{
  input: "8591123",
  boardType: "dep",
  productsFilter: "1:0000001011111111",
  maxJourneys: maxjourneys,
  start: "yes",
  requestType: "0",
},
function(data) {
  eval(data);
  $("#station").text(journeysObj.stationName);
  $.each(journeysObj.journey,function(key,val) {
    $('<div/>', { id: val.id, class:'row'}).appendTo('#body');

    $('<div/>', { id: 'numbercell'+key, class:'numberCell'}).appendTo('#' + val.id);
    var numberCanvas = $('<canvas/>', {class:'numberCanvas', Height: '80px', Width: '80px'}).appendTo('#'+ val.id +' .numberCell');

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

    numberCanvas.drawRect({
      fillStyle: canvasColor,
      x: 0, y: 0,
      width: 80,
      height: 80,
      fromCenter: false
    }).drawText({
      fillStyle:canvasTextColor,
      x: 40, y: 40,
      font: "50px Helvetica, sans-serif",
      text: val.pr
    });

    $('<div/>', { class:'destinationCell', text:val.st}).appendTo('#' + val.id);
    if(val.rt.dlm > 0){
      $('<div/>', { class:'countdownCell', html:val.countdown + ' +' + val.rt.dlm }).appendTo('#' + val.id);
    }
    else {
      $('<div/>', { class:'countdownCell', html:val.countdown}).appendTo('#' + val.id);
    }
    $('<div/>', { class:'clear'}).appendTo('#' + val.id);
      journeyids.push(val.id);
  });
});


$(document).ready(function(){

  setInterval(function(){

      $.get("http://fahrplan.mueslo.de/proxy/bin/stboard.exe/dn?L=vs_stbzvv",
      {
          input: "8591123",
          boardType: "dep",
          productsFilter: "1:0000001011111111",
          maxJourneys: maxjourneys,
          start: "yes",
          requestType: "0",


      },
      function(data) {
          eval(data);

          $.each(journeysObj.journey,function(key,val) {
            if($('#' + val.id).length)
            {
              var $journeyDiv = $('#' + val.id);

              if(val.rt.dlm > 0){
                $journeyDiv.find('.countdownCell').html(val.countdown + ' +' + val.rt.dlm);
              }
              else {
                $journeyDiv.find('.countdownCell').html(val.countdown);
              }

              $journeyDiv.data('has_updated', true);
            }
            else {
              if( $.inArray(val.id,journeyids) == -1) {
                // Build and append new DIV
                $('<div/>', { id: val.id, class:'row'}).appendTo('#body');

                $('<div/>', { class:'numberCell'}).appendTo('#' + val.id);
                var numberCanvas = $('<canvas/>', {class:'numberCanvas', Height: '80px', Width: '80px'}).appendTo('#'+ val.id +' .numberCell');

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

                numberCanvas.drawRect({
                  fillStyle: canvasColor,
                  x: 0, y: 0,
                  width: 80,
                  height: 80,
                  fromCenter: false
                }).drawText({
                  fillStyle:canvasTextColor,
                  x: 40, y: 40,
                  font: "50px Helvetica, sans-serif",
                  text: val.pr
                });

                $('<div/>', { class:'destinationCell', text:val.st}).appendTo('#' + val.id);
                if(val.rt.dlm > 0){
                  $('<div/>', { class:'countdownCell', html:val.countdown + ' +' + val.rt.dlm }).appendTo('#' + val.id);
                }
                else {
                  $('<div/>', { class:'countdownCell', html:val.countdown}).appendTo('#' + val.id);
                }
                
                $('<div/>', { class:'clear', style:'display:none;' }).appendTo('#' + val.id).slideDown(800);

                journeyids.push(val.id);
              }
            }
          });

          updatedjourneyids = new Array;

          $.each(journeysObj.journey,function(key,val) {
            updatedjourneyids.push(val.id);
          });

          var slideUpDelay = 0;

          $.each(journeyids,function(index,val) {
            if ($.inArray(val,updatedjourneyids) == -1) {
              $('#' + val).delay(slideUpDelay).slideUp(600, function(){ this.remove(); });
              delete journeyids[index];
              slideUpDelay += 600;
            }
          });
      });
  }, 5000);
});
