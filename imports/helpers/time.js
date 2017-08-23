export const updateClock = () => {
    var date = new Date();
    var timeString = formatTimeComponent(date.getHours()) + ":" + formatTimeComponent(date.getMinutes()) + ":" + formatTimeComponent(date.getSeconds());
    $('.time').text(timeString);
};

const formatTimeComponent = (value) => {
    if (value > 9) {
        return "" + value;
    } else {
        return "0" + value;
    }
};
