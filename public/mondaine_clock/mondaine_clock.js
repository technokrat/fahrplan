var MondaineClock = function (target) {
    this.bounceTime = 0.5;

    this.paper = Snap(target);

    var group = this.paper.group();
    var clock;

    Snap.load("mondaine_clock/mondaine_clock.svg", function (loadedFragment) {
        clock = loadedFragment;
        group.append(loadedFragment);

        this.clock = clock;

        this.second_hand = this.clock.select("#second_hand");
        this.minute_hand = this.clock.select("#minute_hand");
        this.hour_hand = this.clock.select("#hour_hand");
        this.bbox = this.paper.select("#clock_face").getBBox();
        this.center = [this.bbox.width / 2, this.bbox.height / 2];

        this.update();

        this.animate = true;
        requestAnimationFrame(this.drawLoop.bind(this));
    }.bind(this));


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

    var matrix = Snap.matrix();
    matrix.rotate(rotation, this.center[0], this.center[1]);
    /*if (this.animate) {
        this.second_hand.animate({
            transform: matrix
        }, 1000 / this.refreshRate);
    } else {
        this.second_hand.transform(matrix);
    }*/

    this.second_hand.transform(matrix);

}

MondaineClock.prototype.updateMinuteHand = function (minutes, seconds) {
    if (seconds >= 0 && seconds < this.bounceTime) {
        var rotation = (-1 + mina.elastic(seconds / this.bounceTime) + minutes) / 60.0 * 360.0;
        var matrix = Snap.matrix();
        matrix.rotate(rotation, this.center[0], this.center[1]);
        this.minute_hand.transform(matrix);
    } else if (this.lastMinute !== minutes) {
        var rotation = minutes / 60.0 * 360.0;
        var matrix = Snap.matrix();
        matrix.rotate(rotation, this.center[0], this.center[1]);
        this.minute_hand.transform(matrix);
    }
}

MondaineClock.prototype.updateHourHand = function (hours) {
    var rotation = hours / 12.0 * 360.0;
    var matrix = Snap.matrix();
    matrix.rotate(rotation, this.center[0], this.center[1]);
    this.hour_hand.transform(matrix);
}
