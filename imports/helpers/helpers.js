export const getUrlParameter = (sParam) => {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
}

export const getQueryParams => qs {
    qs = qs.split("+").join(" ");

    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }

    return params;
}

export const recalculateNumberOfConnectionsAndAdaptScreen = function () {
    var bodyPadding;
    var maxjourneys;
    var zoom = getQueryParams(document.location.search).zoom;
    if (!zoom)
        zoom = 1;

    if ($(window).width() >= 1200) {
        maxjourneys = Math.floor(($(window).height() / zoom - $('#schedule .footer').height() / zoom - 120) / 85);
        bodyPadding = ($(window).height() / zoom - $('#schedule .footer').height() / zoom - maxjourneys * 85) / 2;
    } else if ($(window).width() < 1200 && $(window).width() >= 980) {
        maxjourneys = Math.floor(($(window).height() / zoom - $('#schedule .footer').height() / zoom - 96) / 77.75);
        bodyPadding = ($(window).height() / zoom - $('#schedule .footer').height() / zoom - maxjourneys * 77.75) / 2;
    } else if ($(window).width() < 980 && $(window).width() >= 768) {
        maxjourneys = Math.floor(($(window).height() / zoom - $('#schedule .footer').height() / zoom - 96) / 69.25);
        bodyPadding = ($(window).height() / zoom - $('#schedule .footer').height() / zoom - maxjourneys * 69.25) / 2;
    } else if ($(window).width() < 768 && $(window).width() > 480) {
        maxjourneys = Math.floor(($(window).height() / zoom - $('#schedule .footer').height() / zoom - 28) / 85);
        bodyPadding = "";
    } else if ($(window).width() <= 480) {
        maxjourneys = Math.floor(($(window).height() / zoom - $('#schedule .footer').height() / zoom - 20) / 75);
        bodyPadding = "";
    } else {
        bodyPadding = "";
    }

    $('#schedule .body').css('padding', bodyPadding);
    $('body').css('zoom', zoom);

    return maxjourneys;
}
