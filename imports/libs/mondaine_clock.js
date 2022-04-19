import { SVG } from '@svgdotjs/svg.js'

const mondaine_clock = require('@/public/mondaine_clock/mondaine_clock.svg');

export const MondaineClock = function (target) {
    this.bounceTime = 0.5;
    this.draw = SVG().addTo(target);

    this.clock = this.draw.svg(mondaine_clock);
    this.second_hand = this.clock.findOne("#second_hand");
    this.minute_hand = this.clock.findOne("#minute_hand");
    this.hour_hand = this.clock.findOne("#hour_hand");
    this.bbox = this.svg.findOne("#clock_face").getBBox();
    this.center = [this.bbox.width / 2, this.bbox.height / 2];

    this.update();

    this.animate = true;
    requestAnimationFrame(this.drawLoop.bind(this));
}

MondaineClock.prototype.drawLoop = function (timestamp) {
    this.update();
    requestAnimationFrame(this.drawLoop.bind(this));
}

MondaineClock.prototype.update = function () {
    var now = new Date();
    this.updateSecondHand(now.getSeconds() + now.getMilliseconds() / 1000.0);
    this.updateMinuteHand(now.getMinutes(), now.getSeconds() + now.getMilliseconds() / 1000.0);
    this.updateHourHand(now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600);
}

MondaineClock.prototype.updateSecondHand = function (seconds) {
    var rotation = Math.min(seconds / 59, 1.0) * 360.0;
    this.second_hand.rotate(rotation, this.center[0], this.center[1]);
}

MondaineClock.prototype.updateMinuteHand = function (minutes, seconds) {
    if (seconds >= 0 && seconds < this.bounceTime) {
        var rotation = (-1 + mina.elastic(seconds / this.bounceTime) + minutes) / 60.0 * 360.0;
        this.minute_hand.rotate(rotation, this.center[0], this.center[1]);
    } else if (this.lastMinute !== minutes) {
        var rotation = minutes / 60.0 * 360.0;
        this.minute_hand.rotate(rotation, this.center[0], this.center[1]);
    }
}

MondaineClock.prototype.updateHourHand = function (hours) {
    var rotation = hours / 12.0 * 360.0;
    this.hour_hand.rotate(rotation, this.center[0], this.center[1]);
}
