import snap from './snap.svg-min.js';

const train_path = 'train';
const s_bahn_path = 's_bahn';
const tram_path = 'tram';
const bus_path = 'bus';


export const ConnectionBoard = function (target, resizeCallback) {
    this.svg = target;
    this.s = Snap(target);
    this.s.clear();

    this.resizeCallback = resizeCallback;

    this.scale = 0.8;
    this.height = this.s.node.clientHeight;
    this.trackWidth = this.s.node.clientWidth;
    this.trackHeight = 100 * this.scale;
    this.trackCount = Math.floor(this.s.node.clientHeight / this.trackHeight);
    this.trackCenterOffset = (this.s.node.clientHeight % this.trackHeight) / 2;

    this.lastTimestamp = 0;

    this.connectionItems = {};

    this.horizontalOffset = 0;

    this.zeroMinuteLine = this.s.line(0, 0, 0, this.height).attr({
        id: "zero-minutes",
        stroke: "crimson",
        style: 'stroke-width: 5px; mix-blend-mode: screen; stroke-dasharray: 2;'
    });

    this.tenMinuteLine = this.s.line(0, 0, 0, this.height).attr({
        id: "ten-minutes",
        stroke: "SlateGrey ",
        style: 'stroke-width: 3px; mix-blend-mode: screen; stroke-dasharray: 2;'
    });


    this.zeroMinuteLine.attr({
        "x1": -500,
        "x2": -500,
        y2: this.height
    });

    this.tenMinuteLine.attr({
        "x1": -500,
        "x2": -500,
        y2: this.height
    });

    this.initVehicleSymbols().then(() => {
        /* Setup draw loop */
        requestAnimationFrame(this.drawLoop.bind(this));
    });

    $(target).on("connectionBoard.resize", this.resize.bind(this));

    this.resizeCallback(this.trackCount);
};

ConnectionBoard.prototype.initVehicleSymbols = function () {
    var promise = Promise.all(
        [
            this.loadVehicleSymbol(train_path),
            this.loadVehicleSymbol(s_bahn_path),
            this.loadVehicleSymbol(tram_path),
            this.loadVehicleSymbol(bus_path)
        ]
    );

    return promise;
};

ConnectionBoard.prototype.loadVehicleSymbol = function (vehicle) {
    var promise = new Promise((resolve, reject) => {
        Snap.load("/img/" + vehicle + ".svg", ((fragment) => {
            let path = fragment.select("g");
            path.attr("id", vehicle);
            this.s.select("defs").append(path);
            resolve("Loaded " + vehicle);
        }))
    });

    return promise;
};

ConnectionBoard.prototype.resize = function () {
    this.height = this.s.node.clientHeight;
    this.trackWidth = this.s.node.clientWidth;
    this.trackCount = Math.floor(this.s.node.clientHeight / this.trackHeight);
    this.trackCenterOffset = (this.s.node.clientHeight % this.trackHeight) / 2;

    this.updateConnections(this.connections, true);

    this.resizeCallback(this.trackCount);
};

ConnectionBoard.prototype.destroy = function () {
    this.s.clear();
    return;
}

ConnectionBoard.prototype.updateConnections = function (connections, isImmediateDismissal) {
    this.connections = connections;
    let fetchedConnections = connections.fetch();
    if (fetchedConnections.length) {
        let maxCountdown = Math.max(fetchedConnections[Math.min(fetchedConnections.length - 1, this.trackCount - 1)].countdown, 5);
        this.horizontalOffset = (Math.pow((60 - Math.min(maxCountdown, 60)) / 60, 3)) / 2 * this.trackWidth / this.scale;
    }


    let updatedConnectionIDs = [];


    for (var i = 0; i < this.trackCount; i++) {
        var connection = fetchedConnections[i];

        if (connection) {
            updatedConnectionIDs.push(connection._id);
            if (!this.connectionItems[connection._id]) {
                this.connectionItems[connection._id] = new ConnectionItem(connection, this, i);
            } else {
                this.connectionItems[connection._id].update(connection, i);
            }
        } else
            break;
    }

    _.each(this.connectionItems, (item) => {
        if (updatedConnectionIDs.indexOf(item.connection._id) == -1) {
            item.dismiss(isImmediateDismissal);
        }
    });

    if (this.connections.count() === 0) {
        this.zeroMinuteLine.attr({
            "x1": -500,
            "x2": -500,
            y2: this.height
        });

        this.tenMinuteLine.attr({
            "x1": -500,
            "x2": -500,
            y2: this.height
        });

    } else {

        let zeroMinutePosition = (this.trackWidth) - this.horizontalOffset * this.scale;
        let tenMinutePosition = (this.trackWidth - 400 * this.scale) * Math.pow(50 / 60, 3) - this.horizontalOffset * this.scale + 400 * this.scale;
        this.zeroMinuteLine.attr({
            "x1": zeroMinutePosition,
            "x2": zeroMinutePosition,
            y2: this.height
        });

        this.tenMinuteLine.attr({
            "x1": tenMinutePosition,
            "x2": tenMinutePosition,
            y2: this.height
        });

    }


};


ConnectionBoard.prototype.drawLoop = function (timestamp) {
    this.draw(timestamp);
    requestAnimationFrame(this.drawLoop.bind(this));
}


ConnectionBoard.prototype.draw = function (timestamp) {
    this.elapsedTime = (timestamp - this.lastTimestamp) / 1000;
    // If window was inactive do not animate with too large delta
    if (this.elapsedTime > 1000)
        this.elapsedTime = 0;
    this.lastTimestamp = timestamp;

    _.each(this.connectionItems, (connectionItem) => {
        connectionItem.draw();
    });

    this.lastTimestamp = timestamp;
};


const ConnectionItem = function (connection, connectionBoard, track) {
    this.connection = connection;
    this.connectionBoard = connectionBoard;
    this.track = track;

    this.ready = false;
    this.state = "new";

    this.s = this.connectionBoard.s;

    this.svgGroup = this.s.group();
    this.svgGroup.attr('id', this.connection._id);
    this.svgGroup.attr('style', 'mix-blend-mode: screen;');
    var vehicle_type = this.connection.hafas_raw.product.longName;
    var vehicle_path = "";
    switch (vehicle_type) {
        case "Tram":
            vehicle_path = tram_path;
            break;
        case "Bus":
            vehicle_path = bus_path;
            break;
        case "S-Bahn":
            vehicle_path = s_bahn_path;
            break;

        default:
            vehicle_path = train_path;
            break;
    }

    var instance = this.connectionBoard.s.select("#" + vehicle_path).clone();
    this.svgGroup.append(instance);
    this.vehicleWidth = this.svgGroup.select(".vehicle-shape").getBBox().width;
    this.vehicleHeight = this.svgGroup.select(".vehicle-shape").getBBox().height;


    if (this.connection.hafas_raw.product.color.bg.toLocaleLowerCase() == "ffffff" || this.connection.hafas_raw.product.color.bg == "000000") {
        this.svgGroup.select(".vehicle-shape").attr({
            style: "stroke:white; fill:none;"
        });

        if (this.connection.hafas_raw.product.color.fg == "000000") {
            this.svgGroup.select(".vehicle-text").attr({
                x: 21,
                y: 3,
                text: this.connection.hafas_raw.product.line ? this.connection.hafas_raw.product.line : this.connection.hafas_raw.product.name,
                style: "stroke:none;fill:white;text-anchor:middle;font-family: SegoeLi, 'Segoe UI Light', 'Segoe UI', 'Open Sans', 'Helvetica Neue', Helvetica, sans-serif;letter-spacing:-3px;font-size:38pt;"
            });
        } else {
            this.svgGroup.select(".vehicle-text").attr({
                x: 21,
                y: 3,
                text: this.connection.hafas_raw.product.line ? this.connection.hafas_raw.product.line : this.connection.hafas_raw.product.name,
                style: "stroke:none;fill:#" + this.connection.hafas_raw.product.color.fg + ";text-anchor:middle;font-family: SegoeLi, 'Segoe UI Light', 'Segoe UI', 'Open Sans', 'Helvetica Neue', Helvetica, sans-serif;letter-spacing:-3px;font-size:38pt;"
            });
        }


    } else {
        this.svgGroup.select(".vehicle-shape").attr({
            style: "stroke:none;fill:#" + this.connection.hafas_raw.product.color.bg + "; "
        });

        this.svgGroup.select(".vehicle-text").attr({
            x: 21,
            y: 3,
            text: this.connection.hafas_raw.product.line ? this.connection.hafas_raw.product.line : this.connection.hafas_raw.product.name,
            style: "stroke:none;fill:#" + this.connection.hafas_raw.product.color.fg + ";text-anchor:middle;font-family: SegoeLi, 'Segoe UI Light', 'Segoe UI', 'Open Sans', 'Helvetica Neue', Helvetica, sans-serif;letter-spacing:-3px;font-size:38pt;"
        });
    }


    var infoText = getInfoString(this.connection);
    this.infoText = this.svgGroup.text(this.vehicleWidth, this.vehicleHeight / 2, infoText).attr({
        class: "info-text",
        fill: "white",
        fontSize: "32pt",
        fontWeight: 500
    });

    this.tspans = this.infoText.selectAll("tspan").forEach((tspan, i) => {
        tspan.attr({
            x: this.vehicleWidth + 40,
            y: 42 * (i + 1) + (this.vehicleHeight - 84) / 2
        });
    });

    /*
    if (this.connection.hafas_raw.mainLocation.realTime.hasRealTime) {
        this.svgGroup.select(".vehicle-text").attr({
            class: "real_time vehicle-text"
        });
    } else {
        this.svgGroup.select(".vehicle-text").attr({
            class: "vehicle-text"
        });
    }
    */

    this.targetX = -this.connectionBoard.trackWidth;
    this.targetY = this.connectionBoard.trackHeight * (this.track + 1) / this.connectionBoard.scale - this.vehicleHeight + this.connectionBoard.trackCenterOffset / this.connectionBoard.scale;
    this.X = this.targetX;
    this.Y = this.targetY;

    var transformation = Snap.matrix();

    transformation.scale(this.connectionBoard.scale);
    transformation.translate(this.X, this.Y);
    this.svgGroup.transform(transformation);

    this.connectionBoard.s.append(this.svgGroup);

    this.ready = true;


};


ConnectionItem.prototype.update = function (connection, track) {
    this.track = track;
    this.connection = connection;

    let infoText = getInfoString(this.connection);
    let infoChildren = this.svgGroup.select(".info-text").children();

    infoChildren[0].node.textContent = infoText[0];
    infoChildren[1].node.textContent = infoText[1];

    if (this.connection.hafas_raw.mainLocation.realTime.hasRealTime) {
        this.svgGroup.select(".vehicle-text").attr({
            class: "real_time vehicle-text"
        });
    } else {
        this.svgGroup.select(".vehicle-text").attr({
            class: "vehicle-text"
        });
    }

    this.state = "update";
};

ConnectionItem.prototype.dismiss = function (isImmediateDismissal) {
    if (isImmediateDismissal) {
        this.svgGroup.remove();
        delete this.connectionBoard.connectionItems[this.connection._id];
    } else {
        if (this.state != "dismiss") {
            this.state = "dismiss";

            this.timeOfDismissal = this.connectionBoard.lastTimestamp;
        } else {
            // If animation did not end due to inactivity after a second update dismiss immediately
            if ((this.lastTimestamp - this.timeOfDismissal) > 3000) {
                this.svgGroup.remove();
                delete this.connectionBoard.connectionItems[this.connection._id];
            }
        }
    }
};




ConnectionItem.prototype.draw = function () {
    if (this.ready) {

        if (this.state == "dismiss") {

            if (this.connection.countdown <= 2) {


                this.targetX = this.connectionBoard.trackWidth * 2;
                this.X += this.connectionBoard.trackWidth / this.connectionBoard.scale * 0.4 * this.connectionBoard.elapsedTime;

                var transformation = Snap.matrix();
                transformation.scale(this.connectionBoard.scale);
                transformation.translate(this.X, this.Y);
                this.svgGroup.transform(transformation);

                if (this.X >= this.targetX) {
                    this.svgGroup.remove();
                    delete this.connectionBoard.connectionItems[this.connection._id];
                }

            } else {
                this.targetX = -this.connectionBoard.trackWidth;
                this.X -= this.connectionBoard.trackWidth / this.connectionBoard.scale * 0.4 * this.connectionBoard.elapsedTime;

                var transformation = Snap.matrix();
                transformation.scale(this.connectionBoard.scale);
                transformation.translate(this.X, this.Y);
                this.svgGroup.transform(transformation);

                if (this.X <= this.targetX) {
                    this.svgGroup.remove();
                    delete this.connectionBoard.connectionItems[this.connection._id];
                }
            }

        } else {

            let temp = Math.pow((60 - Math.min(this.connection.countdown, 60)) / 60, 3) * (this.connectionBoard.trackWidth - 400 * this.connectionBoard.scale) / this.connectionBoard.trackWidth;

            this.targetX = (this.connectionBoard.trackWidth / this.connectionBoard.scale) * temp - this.vehicleWidth - this.connectionBoard.horizontalOffset + 400;
            this.targetY = this.connectionBoard.trackHeight * (this.track + 1) / this.connectionBoard.scale - this.vehicleHeight + this.connectionBoard.trackCenterOffset / this.connectionBoard.scale;

            this.X += (this.targetX - this.X) * 0.45 * this.connectionBoard.elapsedTime;
            this.Y += (this.targetY - this.Y) * 1.0 * this.connectionBoard.elapsedTime;

            var transformation = Snap.matrix();
            transformation.scale(this.connectionBoard.scale);
            transformation.translate(this.X, this.Y);
            this.svgGroup.transform(transformation);
        }

        if ((this.vehicleWidth / 2 + this.X) > (this.connectionBoard.trackWidth / this.connectionBoard.scale / 2)) {
            this.tspans.forEach((tspan, i) => {
                tspan.attr({
                    x: -40,
                    textAnchor: "end"
                })
            });
        } else {
            this.tspans.forEach((tspan, i) => {
                tspan.attr({
                    x: this.vehicleWidth + 40,
                    textAnchor: "start"
                });
            });
        }
    }
};




function htmlDecode(input) {
    var doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}


function getInfoString(connection) {
    var direction = htmlDecode(connection.hafas_raw.product.direction);
    var countdown = "";

    if (connection.hafas_raw.mainLocation.realTime.hasRealTime) {
        countdown += connection.countdown + "' (" + connection.hafas_raw.mainLocation.realTime.time + ")";
        if (connection.hafas_raw.mainLocation.realTime.platform) {
            countdown += ", ";
            countdown += htmlDecode("Pl. " + connection.hafas_raw.mainLocation.realTime.platform);
        }

        countdown += "*";

    } else {
        countdown += connection.countdown + "' (" + connection.hafas_raw.mainLocation.time + ")";
        if (connection.hafas_raw.mainLocation.platform) {
            countdown += ", ";
            countdown += htmlDecode("Pl. " + connection.hafas_raw.mainLocation.platform);
        }
    }



    return [direction, countdown];
}
