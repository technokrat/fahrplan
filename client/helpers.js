getUrlParameter = function (sParam)
{
	var sPageURL = window.location.search.substring(1);
	var sURLVariables = sPageURL.split('&');
	for (var i = 0; i < sURLVariables.length; i++) 
	{
		var sParameterName = sURLVariables[i].split('=');
		if (sParameterName[0] == sParam) 
		{
			return sParameterName[1];
		}
	}
}

getQueryParams = function (qs) {
	qs = qs.split("+").join(" ");

	var params = {}, tokens,
		re = /[?&]?([^=]+)=([^&]*)/g;

	while (tokens = re.exec(qs)) {
		params[decodeURIComponent(tokens[1])]
			= decodeURIComponent(tokens[2]);
	}

	return params;
}

recalculateNumberOfConnectionsAndAdaptScreen = function()
{
  var bodyPadding;
  var maxjourneys;

  if($(window).width() >= 1200)
  {
    maxjourneys = Math.floor(($(window).height() - $('#schedule .footer').height() - 120) / 85);
    bodyPadding = ($(window).height() - $('#schedule .footer').height() - maxjourneys * 85) / 2;
  }
  else if ($(window).width() < 1200 && $(window).width() >= 980) {
    maxjourneys = Math.floor(($(window).height() - $('#schedule .footer').height() - 96) / 77.75);
    bodyPadding = ($(window).height() - $('#schedule .footer').height() - maxjourneys * 77.75) / 2;
  }
  else if ($(window).width() < 980 && $(window).width() >= 768) {
    maxjourneys = Math.floor(($(window).height() - $('.footer').height() - 96) / 69.25);
    bodyPadding = ($(window).height() - $('#schedule .footer').height() - maxjourneys * 69.25) / 2;
  }
  else if ($(window).width() < 768 && $(window).width() > 480) {
    maxjourneys = Math.floor(($(window).height() - $('#schedule .footer').height() - 28) / 85);
    bodyPadding = "";
  }
  else if ($(window).width() <= 480) {
    maxjourneys = Math.floor(($(window).height() - $('#schedule .footer').height() - 20) / 75);
    bodyPadding = "";
  }
  else {
    bodyPadding = "";
  }

  $('#schedule .body').css('padding', bodyPadding);

  return maxjourneys;
}