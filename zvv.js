
$.get("http://fahrplan.mueslo.de/bin/stboard.exe/dn?L=vs_stbzvv",
{
  input: "8591169",
  boardType: "dep",
  productsFilter: "1:1111111111111111",
  maxJourneys: "9",
  start: "yes",
  requestType: "0",


},
function(data) {

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

  
  
  eval(data);
  $("#station").text(journeysObj.stationName);
  $.each(journeysObj.journey,function(key,val) {
    $('<div/>', { id: 'row'+key, class:'row'}).appendTo('#body');

    $('<div/>', { id: 'numbercell'+key, class:'numberCell'}).appendTo('#row'+key);
    var numberCanvas = $('<canvas/>', {class:'numberCanvas', Height: '80px', Width: '80px'}).appendTo('#numbercell'+key);
    numberCanvas.drawRect({
      fillStyle: colortable[val.pr],
      x: 0, y: 0,
      width: 80,
      height: 80,
      fromCenter: false
    }).drawText({
      fillStyle: textcolortable[val.pr],
      x: 40, y: 40,
      font: "36pt Verdana, sans-serif",
      text: val.pr
    });

    $('<div/>', { class:'destinationCell', text:val.st}).appendTo('#row'+key);
    if(val.rt.dlm > 0){
      $('<div/>', { class:'countdownCell', html:val.countdown + ' +' + val.rt.dlm }).appendTo('#row'+key);
    }
    else {
      $('<div/>', { class:'countdownCell', html:val.countdown}).appendTo('#row'+key);
    }
    $('<div/>', { class:'clear'}).appendTo('#row'+key);
  });


});