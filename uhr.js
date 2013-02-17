var UR_Start, showFilled;

$(document).ready(function() {
  return UR_Start();
});

UR_Start = function() {
  var UR_Indhold, UR_Nu;
  UR_Nu = new Date;
  UR_Indhold = showFilled(UR_Nu.getHours()) + ":" + showFilled(UR_Nu.getMinutes()) + ":" + showFilled(UR_Nu.getSeconds());
  document.getElementById("time").innerHTML = UR_Indhold;
  return setTimeout((function() {
    return UR_Start();
  }), 1000);
};

showFilled = function(Value) {
  if (Value > 9) {
    return "" + Value;
  } else {
    return "0" + Value;
  }
};
